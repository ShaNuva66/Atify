# Thesis Implementation Roadmap

Bu dosya, hedeflediðin tez kapsamýný sprintlere bölmek için hazýrlandý.

## Sprint 1 (Bu turda eklendi)
- Observability: Actuator + Prometheus endpointi
- Docker Compose: backend + mysql + recognizer(mock) + prometheus + grafana
- Benchmark: dataset iskeleti + evaluate script + sonuç þablonu
- CI: build/test workflow
- Security test baþlangýcý

## Sprint 2
- Tanýma benchmarkýný gerçek dataset ile doldurma
- Gürültü üretim scripti (ffmpeg ile SNR seviyeleri)
- Sonuç tablosu + tez grafikleri

## Sprint 3
- Öneri sistemi
  - Ýçerik tabanlý: artist/genre/duration benzerliði
  - Collaborative: playlist co-occurrence
  - Endpoint: `GET /songs/{id}/recommendations`
  - UI: “Bunu dinleyenler bunlarý da dinledi” paneli

## Sprint 4
- Güvenlik sertleþtirme
  - Refresh token
  - Rate limit
  - Brute-force lockout
  - Audit log
  - Policy tablosu + endpoint testleri

## Sprint 5
- Gerçek zamanlý
  - WebSocket: now playing
  - Playlist deðiþimlerinin canlý güncellenmesi

## Sprint 6
- Async job pipeline
  - Fingerprint üretimini queue ile asenkronlaþtýrma
  - Retry + dead-letter
  - Queue metrikleri

## Sprint 7
- Tez çýktýlarý
  - Mimari karar/trade-off/sýnýrlýlýk
  - Mevcut sistemlerle net kýyas tablosu
  - Gelecek çalýþma baþlýklarý
