# Benchmark Results Template

## Overall

| Metric | Value |
|---|---|
| Top-1 Accuracy | 0.00 |
| Precision | 0.00 |
| Recall | 0.00 |
| F1 | 0.00 |

## By Noise Level

| Noise Level | Samples | Top-1 Accuracy | Precision | Recall | F1 |
|---|---:|---:|---:|---:|---:|
| clean | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| noise_10 | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| noise_20 | 0 | 0.00 | 0.00 | 0.00 | 0.00 |
| noise_30 | 0 | 0.00 | 0.00 | 0.00 | 0.00 |

## Notes
- Positive prediction: API'den `matched=true` dönmesi.
- True positive: `matched=true` ve tahmin edilen `songCode` etiket ile ayný.
- False positive: `matched=true` ama songCode yanlýþ.
- False negative: `matched=false` ama örnek aslýnda veri setinde bir þarkýya ait.
