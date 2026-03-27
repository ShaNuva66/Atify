import io
import math
import sys
import wave
from pathlib import Path

import numpy as np

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "recognizer"))

import app as recognizer  # noqa: E402

SAMPLE_RATE = 11025


def synth_song(segments):
    parts = []
    for freq, seconds in segments:
        time_axis = np.linspace(0, seconds, int(SAMPLE_RATE * seconds), endpoint=False)
        clip = 0.45 * np.sin(2 * math.pi * freq * time_axis)
        clip += 0.25 * np.sin(2 * math.pi * (freq * 1.5) * time_axis)
        clip += 0.12 * np.sin(2 * math.pi * (freq * 2.1) * time_axis)
        parts.append(clip.astype(np.float32))
    return np.concatenate(parts)


def to_wav_bytes(samples):
    pcm = np.clip(samples * 32767.0, -32768, 32767).astype(np.int16)
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(pcm.tobytes())
    return buffer.getvalue()


def build_candidate(song_code, samples):
    entries = recognizer.fingerprint_entries(to_wav_bytes(samples))
    return {
        "songCode": song_code,
        "fingerprintData": recognizer.encode_fingerprint(entries),
    }


def main():
    song_a = synth_song([(220, 4), (330, 4), (440, 4), (550, 4)])
    song_b = synth_song([(260, 4), (390, 4), (520, 4), (650, 4)])

    candidates = [
        build_candidate("song:a", song_a),
        build_candidate("song:b", song_b),
    ]

    cases = {
        "song_a_clip": ("song:a", song_a[SAMPLE_RATE * 5:SAMPLE_RATE * 10] + np.random.normal(0, 0.03, SAMPLE_RATE * 5)),
        "song_b_clip": ("song:b", song_b[SAMPLE_RATE * 6:SAMPLE_RATE * 11] + np.random.normal(0, 0.03, SAMPLE_RATE * 5)),
        "noise_only": (None, np.random.normal(0, 0.02, SAMPLE_RATE * 5)),
    }

    failures = []
    for case_name, (expected_code, samples) in cases.items():
        entries = recognizer.fingerprint_entries(to_wav_bytes(samples.astype(np.float32)))
        match = recognizer.best_match(entries, candidates)
        actual_code = None if match is None else match["songCode"]

        if actual_code != expected_code:
            failures.append(
                {
                    "case": case_name,
                    "expected": expected_code,
                    "actual": actual_code,
                    "hashCount": len(entries),
                    "match": match,
                }
            )

    if failures:
        print({"status": "failed", "failures": failures})
        raise SystemExit(1)

    print({"status": "ok", "cases": list(cases.keys())})


if __name__ == "__main__":
    main()
