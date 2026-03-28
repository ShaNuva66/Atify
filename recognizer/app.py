from __future__ import annotations

import base64
import io
import json
import wave
import zlib
from collections import Counter, defaultdict
from typing import Iterable

import numpy as np
from flask import Flask, jsonify, request

app = Flask(__name__)
CATALOG: dict[str, list[tuple[str, int]]] = {}

TARGET_SAMPLE_RATE = 11025
WINDOW_SIZE = 2048
HOP_SIZE = 512
FRAME_STRIDE = 2
FUTURE_WINDOW = 20
FAN_OUT = 4
BAND_EDGES_HZ = (60, 180, 320, 560, 1000, 1800, 3200, 5000)
MIN_HASH_COUNT = 24
MIN_SHARED_HASHES = 10
MIN_OFFSET_MATCHES = 6
MIN_OFFSET_RATIO = 0.03


def read_audio_bytes() -> bytes:
    if "file" in request.files:
        return request.files["file"].read()

    payload = request.get_json(silent=True) or {}
    file_path = payload.get("filePath")
    if file_path:
        with open(file_path, "rb") as file_handle:
            return file_handle.read()

    raise ValueError("audio payload missing")


def load_wav_samples(raw_audio: bytes) -> tuple[np.ndarray, int]:
    with wave.open(io.BytesIO(raw_audio), "rb") as wav_file:
        sample_rate = wav_file.getframerate()
        sample_width = wav_file.getsampwidth()
        channel_count = wav_file.getnchannels()
        frame_bytes = wav_file.readframes(wav_file.getnframes())

    if sample_width == 1:
        samples = np.frombuffer(frame_bytes, dtype=np.uint8).astype(np.float32)
        samples = (samples - 128.0) / 128.0
    elif sample_width == 2:
        samples = np.frombuffer(frame_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    elif sample_width == 4:
        samples = np.frombuffer(frame_bytes, dtype=np.int32).astype(np.float32) / 2147483648.0
    else:
        raise ValueError(f"unsupported sample width: {sample_width}")

    if channel_count > 1:
        samples = samples.reshape(-1, channel_count).mean(axis=1)

    return samples, sample_rate


def resample(samples: np.ndarray, sample_rate: int) -> np.ndarray:
    if sample_rate == TARGET_SAMPLE_RATE or samples.size == 0:
        return samples

    duration = samples.shape[0] / float(sample_rate)
    target_size = max(1, int(duration * TARGET_SAMPLE_RATE))
    old_positions = np.linspace(0.0, duration, num=samples.shape[0], endpoint=False)
    new_positions = np.linspace(0.0, duration, num=target_size, endpoint=False)
    return np.interp(new_positions, old_positions, samples).astype(np.float32)


def normalize(samples: np.ndarray) -> np.ndarray:
    if samples.size == 0:
        return samples

    samples = samples.astype(np.float32)
    samples = samples - float(np.mean(samples))

    peak = float(np.max(np.abs(samples)))
    if peak > 0:
        samples = samples / peak

    emphasized = np.empty_like(samples)
    emphasized[0] = samples[0]
    emphasized[1:] = samples[1:] - 0.97 * samples[:-1]
    return emphasized


def fingerprint_entries(raw_audio: bytes) -> list[tuple[str, int]]:
    samples, sample_rate = load_wav_samples(raw_audio)
    samples = normalize(resample(samples, sample_rate))

    if samples.shape[0] < WINDOW_SIZE:
        samples = np.pad(samples, (0, WINDOW_SIZE - samples.shape[0]))

    frame_count = 1 + max(0, (samples.shape[0] - WINDOW_SIZE) // HOP_SIZE)
    shape = (frame_count, WINDOW_SIZE)
    strides = (samples.strides[0] * HOP_SIZE, samples.strides[0])
    frames = np.lib.stride_tricks.as_strided(samples, shape=shape, strides=strides).copy()
    frames *= np.hanning(WINDOW_SIZE)[None, :]

    spectrum = np.abs(np.fft.rfft(frames, axis=1))
    spectrum = np.log1p(spectrum)
    frame_energy = spectrum.mean(axis=1)
    energy_floor = float(np.percentile(frame_energy, 40))

    freqs = np.fft.rfftfreq(WINDOW_SIZE, d=1.0 / TARGET_SAMPLE_RATE)
    band_indices = [int(np.searchsorted(freqs, edge)) for edge in BAND_EDGES_HZ]

    peaks: list[tuple[int, int]] = []
    for frame_index in range(0, spectrum.shape[0], FRAME_STRIDE):
        if frame_energy[frame_index] < energy_floor:
            continue

        for left, right in zip(band_indices[:-1], band_indices[1:]):
            if right - left < 2:
                continue

            band_slice = spectrum[frame_index, left:right]
            local_index = int(np.argmax(band_slice))
            peaks.append((frame_index, left + local_index))

    if not peaks:
        return []

    entries: list[tuple[str, int]] = []
    for anchor_index, (anchor_time, anchor_freq) in enumerate(peaks):
        pair_count = 0
        for target_time, target_freq in peaks[anchor_index + 1:]:
            delta_time = target_time - anchor_time
            if delta_time < 1:
                continue
            if delta_time > FUTURE_WINDOW:
                break

            hash_key = f"{anchor_freq // 2}:{target_freq // 2}:{delta_time}"
            entries.append((hash_key, anchor_time))
            pair_count += 1

            if pair_count >= FAN_OUT:
                break

    return entries


def encode_fingerprint(entries: list[tuple[str, int]]) -> str:
    payload = {"version": 1, "hashes": entries}
    packed = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    return base64.b64encode(zlib.compress(packed, level=9)).decode("ascii")


def decode_fingerprint(encoded: str) -> list[tuple[str, int]]:
    try:
        packed = zlib.decompress(base64.b64decode(encoded.encode("ascii")))
        payload = json.loads(packed.decode("utf-8"))
    except Exception as exc:  # noqa: BLE001
        raise ValueError("invalid fingerprint payload") from exc

    hashes = payload.get("hashes")
    if not isinstance(hashes, list):
        raise ValueError("fingerprint hashes missing")

    entries: list[tuple[str, int]] = []
    for item in hashes:
        if not isinstance(item, (list, tuple)) or len(item) != 2:
            continue
        hash_key, anchor_time = item
        if isinstance(hash_key, str) and isinstance(anchor_time, int):
            entries.append((hash_key, anchor_time))
    return entries


def score_candidate(
    query_entries: Iterable[tuple[str, int]],
    candidate_entries: Iterable[tuple[str, int]],
) -> tuple[int, int]:
    candidate_lookup: dict[str, list[int]] = defaultdict(list)
    for hash_key, anchor_time in candidate_entries:
        candidate_lookup[hash_key].append(anchor_time)

    offset_counts: Counter[int] = Counter()
    shared_hashes = 0

    for hash_key, anchor_time in query_entries:
        target_times = candidate_lookup.get(hash_key)
        if not target_times:
            continue

        shared_hashes += 1
        for target_time in target_times[:4]:
            offset_counts[target_time - anchor_time] += 1

    best_offset_matches = offset_counts.most_common(1)[0][1] if offset_counts else 0
    return best_offset_matches, shared_hashes


def best_match(query_entries: list[tuple[str, int]], candidates: list[dict]) -> dict | None:
    if len(query_entries) < MIN_HASH_COUNT:
        return None

    winner: dict | None = None
    for candidate in candidates:
        song_code = candidate.get("songCode")
        fingerprint_data = candidate.get("fingerprintData")
        if not song_code or not fingerprint_data:
            continue

        try:
            candidate_entries = decode_fingerprint(fingerprint_data)
        except ValueError:
            continue

        offset_matches, shared_hashes = score_candidate(query_entries, candidate_entries)
        offset_ratio = offset_matches / max(len(query_entries), 1)

        if offset_matches < MIN_OFFSET_MATCHES:
            continue
        if shared_hashes < MIN_SHARED_HASHES:
            continue
        if offset_ratio < MIN_OFFSET_RATIO:
            continue

        current = {
            "songCode": song_code,
            "offsetMatches": offset_matches,
            "sharedHashes": shared_hashes,
            "offsetRatio": offset_ratio,
        }

        if winner is None:
            winner = current
            continue

        if current["offsetMatches"] > winner["offsetMatches"]:
            winner = current
            continue
        if current["offsetMatches"] == winner["offsetMatches"] and current["sharedHashes"] > winner["sharedHashes"]:
            winner = current

    return winner


def catalog_candidates() -> list[dict]:
    return [
        {"songCode": song_code, "fingerprintData": encode_fingerprint(entries)}
        for song_code, entries in CATALOG.items()
    ]


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/catalog-status")
def catalog_status():
    return jsonify({"status": "ok", "catalogSize": len(CATALOG)})


@app.post("/reset-catalog")
def reset_catalog():
    CATALOG.clear()
    return jsonify({"status": "ok", "catalogSize": len(CATALOG)})


@app.post("/unregister-fingerprint")
def unregister_fingerprint():
    payload = request.get_json(silent=True) or {}
    song_code = payload.get("songCode")

    if not song_code:
        return jsonify({"status": "error", "message": "songCode is required"}), 400

    removed = CATALOG.pop(song_code, None) is not None
    return jsonify({"status": "ok", "removed": removed, "catalogSize": len(CATALOG)})


@app.post("/fingerprint-file")
def fingerprint_file():
    try:
        raw_audio = read_audio_bytes()
        entries = fingerprint_entries(raw_audio)
        song_code = request.form.get("songCode")
    except Exception as exc:  # noqa: BLE001
        return jsonify({"status": "error", "message": str(exc)}), 400

    if len(entries) < MIN_HASH_COUNT:
        return jsonify({"status": "error", "message": "not enough audio features", "hashCount": len(entries)}), 422

    if song_code:
        CATALOG[song_code] = entries

    return jsonify(
        {
            "status": "ok",
            "fingerprintData": encode_fingerprint(entries),
            "hashCount": len(entries),
        }
    )


@app.post("/register-fingerprint")
def register_fingerprint():
    payload = request.get_json(silent=True) or {}
    song_code = payload.get("songCode")
    fingerprint_data = payload.get("fingerprintData")

    if not song_code or not fingerprint_data:
        return jsonify({"status": "error", "message": "songCode and fingerprintData are required"}), 400

    try:
        CATALOG[song_code] = decode_fingerprint(fingerprint_data)
    except ValueError as exc:
        return jsonify({"status": "error", "message": str(exc)}), 400

    return jsonify({"status": "ok", "catalogSize": len(CATALOG)})


@app.post("/recognize-simple")
def recognize_simple():
    try:
        raw_audio = read_audio_bytes()
        entries = fingerprint_entries(raw_audio)
        candidates = json.loads(request.form.get("candidates", "[]")) if request.form.get("candidates") else catalog_candidates()
    except Exception as exc:  # noqa: BLE001
        return jsonify({"match": False, "songCode": None, "message": str(exc)}), 400

    winner = best_match(entries, candidates)
    if winner is None:
        return jsonify({"match": False, "songCode": None})

    return jsonify({"match": True, "songCode": winner["songCode"]})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
