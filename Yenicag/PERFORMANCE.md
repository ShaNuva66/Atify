# Performans Notları

Son doğrulama: 10 Eylül 2026 — sürüm 1.6.0

## Uygulanan optimizasyonlar

- Taktik mühimmat atlası PNG yerine şeffaf WebP kullanıyor: 1.956.090 bayttan 396.744 bayta indi (%79,7 azalma).
- Menü, mühimmat atlaslarını maç başlayana kadar yüklemiyor.
- Statik metin dosyaları Brotli/gzip ile aktarılıyor; sürümlü görseller bir yıl `immutable` önbellekte tutuluyor.
- Arazi yüksekliği iki piksellik önbellekten okunuyor; zemin katmanı yalnızca krater oluşunca yeniden çiziliyor.
- Fizik 60 Hz çalışıyor. Düşük güçlü veya mobil cihazlarda çizim 30 FPS ile sınırlandırılıyor.
- Menü ve arka plan sekmesinde oyun Canvas'ı çizilmiyor.
- Parçacık havuzu, parçacık/mermi izi sınırları ve düşük güçlü cihazlarda azaltılmış gölgeler kullanılıyor.
- Çevrim içi hareket paketleri yaklaşık 18 yerine 12,5 paket/sn gönderiliyor.
- Sunucuda WebSocket geri basıncı, mesaj hız sınırı, oda bazlı tur zamanlayıcısı ve kullanılmayan oda temizliği bulunuyor.

## Ölçümler

Headless Chromium, temiz tarayıcı bağlamı ve yerel sunucu:

| Senaryo | Aktarılan kaynak boyutu | Hata |
|---|---:|---:|
| Menü | 1.217.094 bayt | 0 |
| Masaüstü maç | 1.924.640 bayt | 0 |
| Mobil maç | 1.924.640 bayt | 0 |

Yerel sentetik WebSocket testi:

| Bağlantı | Oda | Maçları hazırlama | Toplu hareket yayını |
|---:|---:|---:|---:|
| 100 | 50 | 231 ms | 8 ms |
| 500 | 250 | 787 ms | 22 ms |
| 1.000 | 500 | 1.509 ms | 54 ms |

1.000 bağlantı testi sonrasında sunucu HTTP 200 yanıt vermeye devam etti. Bu sonuç yerel sentetik ölçümdür; gerçek üretim kapasitesi ağ, işlemci, ters proxy ve bölgesel gecikmeyle ayrıca sınanmalıdır.

## Sonraki performans bütçeleri

- Menü aktarımı: 1,25 MB altında
- İlk maç aktarımı: 2 MB altında
- Masaüstü: hedef 60 FPS
- Düşük güçlü mobil: sabit 30 FPS
- Normal hareket trafiği: oyuncu başına en fazla 13 mesaj/sn
