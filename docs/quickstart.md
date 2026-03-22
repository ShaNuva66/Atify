# Quickstart (Observability + Benchmark)

## 1) Çalýþtýr

```bash
docker compose up --build
```

Servisler:
- Backend: http://localhost:8080
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

## 2) Backend metrikleri
- Prometheus endpointi: http://localhost:8080/actuator/prometheus

## 3) Benchmark çalýþtýr

```bash
pip install -r benchmark/requirements.txt
python benchmark/evaluate_recognition.py
```

Çýktýlar:
- `benchmark/results/detailed_results.csv`
- `benchmark/results/results.md`

## 4) Tez tablosu için þablon
- `benchmark/results/results_template.md`
