import argparse
import csv
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

import requests


@dataclass
class SampleResult:
    clip_path: str
    expected_song_name: str
    noise_level: str
    matched: bool
    predicted_song_name: str


def normalize(value: str) -> str:
    return (value or "").strip().casefold()


def compute_metrics(results: List[SampleResult]) -> Dict[str, float]:
    tp = 0
    fp = 0
    fn = 0
    total = len(results)
    top1_correct = 0

    for r in results:
        expected = normalize(r.expected_song_name)
        predicted = normalize(r.predicted_song_name)

        if r.matched and predicted == expected and expected:
            tp += 1
            top1_correct += 1
        elif r.matched and predicted != expected:
            fp += 1
        elif not r.matched and expected:
            fn += 1

    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0
    top1 = top1_correct / total if total else 0.0

    return {
        "samples": total,
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "top1": top1,
        "precision": precision,
        "recall": recall,
        "f1": f1,
    }


def identify_song(api_url: str, clip_file: Path, timeout: float) -> Tuple[bool, str]:
    with clip_file.open("rb") as f:
        files = {"file": (clip_file.name, f, "audio/wav")}
        resp = requests.post(api_url, files=files, timeout=timeout)

    resp.raise_for_status()
    data = resp.json()
    matched = bool(data.get("matched"))
    song_name = data.get("songName") or ""
    return matched, song_name


def load_manifest(manifest_path: Path) -> List[Dict[str, str]]:
    with manifest_path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)


def write_detailed_csv(output_path: Path, rows: List[SampleResult]) -> None:
    with output_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["clip_path", "expected_song_name", "noise_level", "matched", "predicted_song_name"])
        for r in rows:
            writer.writerow([r.clip_path, r.expected_song_name, r.noise_level, r.matched, r.predicted_song_name])


def write_summary_md(output_path: Path, overall: Dict[str, float], by_noise: Dict[str, Dict[str, float]]) -> None:
    lines = [
        "# Recognition Benchmark Results",
        "",
        "## Overall",
        "",
        "| Metric | Value |",
        "|---|---:|",
        f"| Samples | {overall['samples']} |",
        f"| Top-1 Accuracy | {overall['top1']:.4f} |",
        f"| Precision | {overall['precision']:.4f} |",
        f"| Recall | {overall['recall']:.4f} |",
        f"| F1 | {overall['f1']:.4f} |",
        "",
        "## By Noise Level",
        "",
        "| Noise Level | Samples | Top-1 Accuracy | Precision | Recall | F1 |",
        "|---|---:|---:|---:|---:|---:|",
    ]

    for noise, metric in sorted(by_noise.items()):
        lines.append(
            f"| {noise} | {metric['samples']} | {metric['top1']:.4f} | {metric['precision']:.4f} | {metric['recall']:.4f} | {metric['f1']:.4f} |"
        )

    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Run recognition benchmark against /api/identify")
    parser.add_argument("--api-url", default="http://localhost:8080/api/identify")
    parser.add_argument("--dataset-root", default="benchmark/dataset")
    parser.add_argument("--manifest", default="benchmark/dataset/manifest.csv")
    parser.add_argument("--out-csv", default="benchmark/results/detailed_results.csv")
    parser.add_argument("--out-md", default="benchmark/results/results.md")
    parser.add_argument("--timeout", type=float, default=30.0)
    args = parser.parse_args()

    manifest_path = Path(args.manifest)
    dataset_root = Path(args.dataset_root)
    out_csv = Path(args.out_csv)
    out_md = Path(args.out_md)

    records = load_manifest(manifest_path)
    results: List[SampleResult] = []

    for record in records:
        clip_rel = record["clip_path"].strip()
        expected_song_name = record.get("expected_song_name", "").strip()
        noise_level = record.get("noise_level", "unknown").strip() or "unknown"

        clip_file = dataset_root / clip_rel
        if not clip_file.exists():
            print(f"[WARN] Missing file, skipping: {clip_file}")
            continue

        try:
            matched, predicted_song_name = identify_song(args.api_url, clip_file, args.timeout)
        except Exception as exc:
            print(f"[WARN] Request failed for {clip_file}: {exc}")
            matched, predicted_song_name = False, ""

        results.append(
            SampleResult(
                clip_path=clip_rel,
                expected_song_name=expected_song_name,
                noise_level=noise_level,
                matched=matched,
                predicted_song_name=predicted_song_name,
            )
        )

    overall = compute_metrics(results)

    by_noise: Dict[str, List[SampleResult]] = {}
    for r in results:
        by_noise.setdefault(r.noise_level, []).append(r)

    by_noise_metrics = {noise: compute_metrics(items) for noise, items in by_noise.items()}

    out_csv.parent.mkdir(parents=True, exist_ok=True)
    out_md.parent.mkdir(parents=True, exist_ok=True)

    write_detailed_csv(out_csv, results)
    write_summary_md(out_md, overall, by_noise_metrics)

    print(json.dumps({"overall": overall, "by_noise": by_noise_metrics}, indent=2))


if __name__ == "__main__":
    main()
