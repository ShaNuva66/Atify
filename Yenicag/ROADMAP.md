# Pati Savaşları Geliştirme Yol Haritası

Bu dosya uzun geliştirme sürecinin tek takip kaynağıdır. Bir aşama ancak oynanabilir, görsel olarak kontrol edilmiş ve testleri geçmişse tamamlandı kabul edilir.

## Tamamlananlar

- [x] Aşama 1: Atış fiziği, rüzgâr, engebeli ve parçalanabilir arazi
- [x] Aşama 1: Yürüme, zıplama, hareket enerjisi ve çevrim içi eşitleme
- [x] Aşama 1: 25 saniyelik sunucu kontrollü tur sayacı
- [x] Aşama 1: Sınırlı mühimmat, sağlık/mühimmat/kalkan sandıkları
- [x] Aşama 2: El bombası, yapışkan bomba, mayın ve hava akını
- [x] Aşama 2: Matkap roketi, itici bomba, zehir kapsülü ve ışınlayıcı
- [x] Aşama 2: Yanma, donma, zehir, sersemleme ve geri savrulma
- [x] Aşama 2: Yeni taktik mühimmat görsel atlası ve durum göstergeleri
- [x] Aşama 4: Oda sahibine özel tur süresi, başlangıç canı, rüzgâr, sandık ve ani ölüm kuralları
- [x] Aşama 4: Kontrol Noktası, Silah Yarışı ve her tur değişen Kaos maçları
- [x] Performans: WebP atlas, HTTP Brotli/cache ve gecikmeli oyun assetleri
- [x] Performans: Önbellekli arazi katmanı, 60 Hz fizik ve mobil 30 FPS profili
- [x] Performans: Ağ hareket paketlerini azaltma, WebSocket geri basıncı ve oda temizliği

## Sıradaki aşamalar

### Aşama 3 — Harita sistemleri

- [x] Kırılabilen ince platformlar
- [x] Lav, buz, su ve çamur yüzeyleri
- [x] Patlayan variller ve zincirleme patlama
- [x] Düşme hasarı ve güvenli yeniden yerleştirme
- [x] 12. turdan sonra daralan ani ölüm bölgesi
- [x] Haritaya özel en fazla iki okunabilir mekanik

### Aşama 4 — Oyun modları ve yapay zekâ

- [x] Gelişmiş 1v1 ve zorluk seviyeleri
- [x] 2v2 takım savaşı
- [x] 3–4 oyunculu herkes tek
- [x] Hayatta kalma dalgaları
- [x] Kontrol noktası ve kaos modu
- [x] Sekiz aşamalı Silah Yarışı modu
- [x] Rüzgâr, arazi, sandık ve mühimmat planlayan bot

### Aşama 5 — Çevrim içi ürün altyapısı

- [ ] Kullanıcı hesabı ve profil
- [ ] Arkadaş listesi ve özel davet
- [ ] Otomatik beceri eşleştirmesi
- [ ] Yeniden bağlanma ve bot devralması
- [ ] Maç geçmişi, tekrar ve liderlik tablosu
- [ ] Sunucu doğrulaması, hız sınırları ve raporlama

### Aşama 6 — İlerleme ve sunum

- [ ] Eğitim ve antrenman alanı
- [ ] Günlük/haftalık görevler ve başarımlar
- [ ] Hesap seviyesi ve karakter ustalığı
- [ ] Güç vermeyen kostüm, silah görünümü ve zafer pozları
- [ ] Sezonlar ve turnuvalar
- [ ] Gelişmiş kamera, ses, hasar ve durum efektleri

## Denge ilkeleri

- Ücretli veya kozmetik içerik oynanış gücü vermez.
- Kritik hasar gibi sonucu açıklanamayan rastgele avantajlar kullanılmaz.
- Güçlü silahlar mühimmat, kullanım zorluğu veya konum riskiyle dengelenir.
- Sunucu; tur, konum, mühimmat ve maç sonucunda son karar sahibidir.
- Her yeni sistem masaüstü, mobil, antrenman ve çevrim içi maçta kontrol edilir.
