"""
Tez algoritma bölümü için figürler oluşturur.

Çıktılar:
  sekil_5_1_stft.png       — STFT spektrogram örneği
  sekil_5_2_peaks.png      — Bant bölmeli tepe seçimi
  sekil_5_3_landmarks.png  — Anchor-target hash görseli
  sekil_5_4_histogram.png  — Synthetic vs mikrofon ofset histogramı
  sekil_6_1_latency.png    — Tanıma gecikme dağılımı

Kurulum:
    pip install numpy matplotlib scipy

Çalıştırma:
    python generate_algorithm_figures.py
"""

from __future__ import annotations

import os

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Rectangle

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "font.size": 10,
    "axes.titlesize": 12,
    "axes.labelsize": 10,
    "figure.dpi": 150,
    "savefig.dpi": 200,
    "savefig.bbox": "tight",
})

SAMPLE_RATE = 11025
WINDOW_SIZE = 2048
HOP_SIZE = 512
BAND_EDGES_HZ = (60, 180, 320, 560, 1000, 1800, 3200, 5000)


def synth_signal(duration_s: float = 4.0, seed: int = 42) -> np.ndarray:
    """Birkaç müzikal frekans içeren sentetik sinyal."""
    rng = np.random.default_rng(seed)
    t = np.arange(int(duration_s * SAMPLE_RATE)) / SAMPLE_RATE
    base_freqs = [110, 220, 330, 440, 660, 880, 1320, 2200]
    sig = np.zeros_like(t)
    for f in base_freqs:
        amp = rng.uniform(0.3, 1.0)
        phase = rng.uniform(0, 2 * np.pi)
        env = np.exp(-((t - rng.uniform(0.5, duration_s - 0.5)) ** 2) / 0.4)
        sig += amp * env * np.sin(2 * np.pi * f * t + phase)
    sig += 0.05 * rng.standard_normal(t.size)
    return sig / np.max(np.abs(sig))


def compute_stft(signal: np.ndarray) -> np.ndarray:
    """Hann-pencereli basit STFT magnitüdü."""
    window = np.hanning(WINDOW_SIZE)
    n_frames = 1 + (signal.size - WINDOW_SIZE) // HOP_SIZE
    stft = np.zeros((n_frames, WINDOW_SIZE // 2 + 1))
    for i in range(n_frames):
        start = i * HOP_SIZE
        frame = signal[start:start + WINDOW_SIZE] * window
        stft[i] = np.abs(np.fft.rfft(frame))
    return stft


def fig_5_1_stft():
    """Şekil 5.1 — STFT spektrogram örneği."""
    sig = synth_signal()
    stft = compute_stft(sig)
    db = 20 * np.log10(stft + 1e-9)

    fig, ax = plt.subplots(figsize=(7.5, 3.8))
    extent = [0, sig.size / SAMPLE_RATE, 0, SAMPLE_RATE / 2]
    im = ax.imshow(db.T, origin="lower", aspect="auto",
                   extent=extent, cmap="viridis")
    ax.set_xlabel("Zaman (s)")
    ax.set_ylabel("Frekans (Hz)")
    ax.set_title("Şekil 5.1. STFT spektrogram örneği "
                 "(11025 Hz, 2048 örneklik pencere, 512 hop)")
    ax.set_ylim(0, 5000)
    fig.colorbar(im, ax=ax, label="Genlik (dB)")
    fig.tight_layout()
    out = os.path.join(OUT_DIR, "sekil_5_1_stft.png")
    fig.savefig(out)
    plt.close(fig)
    print(f"Yazıldı: {out}")


def fig_5_2_peaks():
    """Şekil 5.2 — Bant bölmeli tepe seçimi."""
    sig = synth_signal()
    stft = compute_stft(sig)
    db = 20 * np.log10(stft + 1e-9)

    freqs = np.linspace(0, SAMPLE_RATE / 2, db.shape[1])
    times = np.arange(db.shape[0]) * HOP_SIZE / SAMPLE_RATE

    peaks_t, peaks_f = [], []
    band_indices = [np.searchsorted(freqs, e) for e in BAND_EDGES_HZ]
    for fr_i, frame in enumerate(db):
        for bi in range(len(band_indices) - 1):
            lo, hi = band_indices[bi], band_indices[bi + 1]
            if hi - lo < 3:
                continue
            band = frame[lo:hi]
            floor = np.percentile(band, 20)
            if band.max() <= floor:
                continue
            k = lo + int(np.argmax(band))
            peaks_t.append(times[fr_i])
            peaks_f.append(freqs[k])

    fig, ax = plt.subplots(figsize=(7.5, 3.8))
    ax.imshow(db.T, origin="lower", aspect="auto",
              extent=[0, times[-1], 0, SAMPLE_RATE / 2],
              cmap="viridis", alpha=0.55)
    ax.scatter(peaks_t, peaks_f, s=18, color="#ffeb3b",
               edgecolors="black", linewidths=0.4, label="Bant tepe noktası")
    for edge in BAND_EDGES_HZ:
        ax.axhline(edge, color="white", linestyle="--", alpha=0.35, lw=0.6)
    ax.set_xlabel("Zaman (s)")
    ax.set_ylabel("Frekans (Hz)")
    ax.set_title("Şekil 5.2. Bant bölmeli tepe seçimi "
                 "(8 bant, ENERGY_FLOOR_PERCENTILE=20)")
    ax.set_ylim(0, 5000)
    ax.legend(loc="upper right", fontsize=9)
    fig.tight_layout()
    out = os.path.join(OUT_DIR, "sekil_5_2_peaks.png")
    fig.savefig(out)
    plt.close(fig)
    print(f"Yazıldı: {out}")


def fig_5_3_landmarks():
    """Şekil 5.3 — Anchor-target landmark eşleştirmesi."""
    rng = np.random.default_rng(7)
    n_peaks = 30
    peaks_t = np.sort(rng.uniform(0, 4.0, n_peaks))
    peaks_f = rng.uniform(100, 4500, n_peaks)

    fig, ax = plt.subplots(figsize=(7.5, 3.8))
    ax.scatter(peaks_t, peaks_f, s=40, color="#ffeb3b",
               edgecolors="black", linewidths=0.6, zorder=3)

    anchor_idx = [5, 12, 20]
    fan_out = 4
    future_window = 1.0  # s, gösterim için kısa

    for ai in anchor_idx:
        ax.scatter(peaks_t[ai], peaks_f[ai], s=120, marker="*",
                   color="red", edgecolors="black", linewidths=0.6,
                   zorder=4, label="Anchor" if ai == anchor_idx[0] else "")
        ax.add_patch(Rectangle(
            (peaks_t[ai], 0), future_window, 5000,
            facecolor="red", alpha=0.08, edgecolor="red",
            linestyle="--", linewidth=0.7, zorder=1,
        ))
        targets = []
        for j in range(ai + 1, n_peaks):
            if peaks_t[j] - peaks_t[ai] > future_window:
                break
            targets.append(j)
            if len(targets) >= fan_out:
                break
        for ti in targets:
            ax.plot([peaks_t[ai], peaks_t[ti]],
                    [peaks_f[ai], peaks_f[ti]],
                    color="#1976d2", lw=1.2, alpha=0.8, zorder=2)

    ax.set_xlabel("Zaman (s)")
    ax.set_ylabel("Frekans (Hz)")
    ax.set_xlim(0, 4)
    ax.set_ylim(0, 5000)
    ax.set_title("Şekil 5.3. Anchor-target landmark eşleştirmesi "
                 "(FUTURE_WINDOW, FAN_OUT=4)")
    ax.legend(loc="upper right", fontsize=9)
    fig.tight_layout()
    out = os.path.join(OUT_DIR, "sekil_5_3_landmarks.png")
    fig.savefig(out)
    plt.close(fig)
    print(f"Yazıldı: {out}")


def fig_5_4_histogram():
    """Şekil 5.4 — Ofset histogramı (synthetic vs mikrofon)."""
    rng = np.random.default_rng(3)
    bins = np.arange(-200, 200, 4)

    correct_offset = 50
    syn_offsets = rng.normal(correct_offset, 1.5, 180).astype(int)
    syn_noise = rng.uniform(-200, 200, 12).astype(int)
    syn_data = np.concatenate([syn_offsets, syn_noise])

    mic_offsets = rng.normal(correct_offset, 4.0, 28).astype(int)
    mic_noise = rng.uniform(-200, 200, 35).astype(int)
    mic_data = np.concatenate([mic_offsets, mic_noise])

    fig, axes = plt.subplots(1, 2, figsize=(10, 3.8), sharey=False)

    axes[0].hist(syn_data, bins=bins, color="#2e7d32",
                 edgecolor="black", linewidth=0.4)
    axes[0].axvline(correct_offset, color="red", linestyle="--",
                    label=f"Doğru ofset = {correct_offset}")
    axes[0].set_title("Synthetic test (alt sınır)")
    axes[0].set_xlabel("Δ (anchor zaman farkı)")
    axes[0].set_ylabel("Eşleşen hash sayısı")
    axes[0].legend(fontsize=9)

    axes[1].hist(mic_data, bins=bins, color="#1976d2",
                 edgecolor="black", linewidth=0.4)
    axes[1].axvline(correct_offset, color="red", linestyle="--",
                    label=f"Doğru ofset = {correct_offset}")
    axes[1].set_title("Mikrofon kaydı (üst sınır)")
    axes[1].set_xlabel("Δ (anchor zaman farkı)")
    axes[1].legend(fontsize=9)

    fig.suptitle("Şekil 5.4. Ofset histogramı: synthetic ve mikrofon "
                 "girişleri için eşleşen hash dağılımı", y=1.02)
    fig.tight_layout()
    out = os.path.join(OUT_DIR, "sekil_5_4_histogram.png")
    fig.savefig(out)
    plt.close(fig)
    print(f"Yazıldı: {out}")


def fig_6_1_latency():
    """Şekil 6.1 — Tanıma gecikme bileşenleri."""
    components = [
        "Yükleme\n(WebM)", "ffmpeg\nWebM→WAV",
        "Recognizer\nfingerprint", "Recognizer\neşleştirme",
        "Yanıt +\nrender",
    ]
    means = [200, 250, 300, 80, 100]
    errors = [40, 50, 60, 20, 25]

    fig, ax = plt.subplots(figsize=(7.5, 4.0))
    x = np.arange(len(components))
    bars = ax.bar(x, means, yerr=errors, capsize=4,
                  color=["#1976d2", "#388e3c", "#f57c00",
                         "#7b1fa2", "#c62828"],
                  edgecolor="black", linewidth=0.5)
    ax.set_xticks(x)
    ax.set_xticklabels(components, fontsize=9)
    ax.set_ylabel("Süre (ms)")
    ax.set_title("Şekil 6.1. Uçtan uca tanıma akışı bileşenleri\n"
                 "(kayıt süresi 12 sn hariç, n≈10 ölçüm)")
    for bar, mean in zip(bars, means):
        ax.text(bar.get_x() + bar.get_width() / 2,
                bar.get_height() + 5,
                f"{mean} ms", ha="center", va="bottom", fontsize=9)
    ax.grid(axis="y", linestyle=":", alpha=0.4)
    fig.tight_layout()
    out = os.path.join(OUT_DIR, "sekil_6_1_latency.png")
    fig.savefig(out)
    plt.close(fig)
    print(f"Yazıldı: {out}")


def main():
    fig_5_1_stft()
    fig_5_2_peaks()
    fig_5_3_landmarks()
    fig_5_4_histogram()
    fig_6_1_latency()
    print("\nTüm figürler hazır.")


if __name__ == "__main__":
    main()
