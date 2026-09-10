# Pati Savaşları

Tarayıcıda çalışan, fizik tabanlı ve sıra tabanlı özgün 2D arena oyunu MVP'si.

## Hazır özellikler

- Yapay zekâya karşı antrenman
- Oda koduyla çevrim içi 1v1
- Rüzgâr ve balistik mermi fiziği
- 8 farklı balistiğe sahip silah: fındık, roket, üçleyen, buz küresi, meteor, plazma, beşli ve seken top
- 6 seçilebilir savaşçı: tilki, rakun, tavşan, baykuş, ayı ve kedi
- Farklı yerçekimi/rüzgâr değerlerine sahip 3 arena
- Patlamayla değişen arazi ve alan hasarı
- Sinematik günbatımı arenası ve özgün savaşçı görselleri
- Mermi izi, patlama halkası, hasar göstergesi ve kamera sarsıntısı
- Karakter fırlatıcısına bağlanan ve havadaki mermiyle birebir eşleşen 8 parçalı mühimmat atlası
- Ellerin silahın önünde kaldığı katmanlı tutuş, nefes/salınım, silah değiştirme, geri tepme ve namlu parlaması animasyonları
- Tur başına 160 enerji kullanan klavye/dokunmatik hareket sistemi ve çevrim içi konum doğrulaması
- Fareyle nişan alma, basılı tuttukça dolan atış gücü ve bırakınca ateş etme
- Hareket enerjisi kullanan zıplama, havada yön verme ve çevrim içi zıplama eşitlemesi
- Sunucu tarafından yönetilen 25 saniyelik tur sayacı ve süre dolunca otomatik tur geçişi
- Silah başına sınırlı mühimmat; temel Fındık silahında sınırsız atış
- Haritadaki sağlık, mühimmat ve patlama hasarını emen kalkan sandıkları
- El bombası, yapışkan bomba, mayın, hava akını, matkap roketi, itici bomba, zehir kapsülü ve ışınlayıcıdan oluşan 8 yeni taktik silah
- Yanma, donma, zehir ve sersemleme durum etkileri; patlamaya bağlı geri savrulma
- Arenaya özel lav, çamur, su, spor, buz ve ince buz yüzeyleri
- Kırılabilir platformlar, zincirleme patlayan variller ve derin çukurlarda düşme cezası
- 12. turdan sonra her tur daralan ani ölüm alanı
- Kolay, Normal, Zor ve Usta seviyelerinde balistik simülasyon kullanan taktik bot
- Canını ve mühimmatını yenileyerek giderek güçlenen rakip dalgalarına karşı Hayatta Kalma modu
- Oda koduyla oynanan sunucu kontrollü 1v1 ve dört kişilik Herkes Tek çevrim içi modları
- Dört kişilik maçlarda elenenleri atlayan tur sırası, son kalan kuralı ve canlı kadro şeridi
- Dönüşümlü tur sıralı 2v2 takım savaşı, takım renkleri, takım zafer koşulu ve açılıp kapatılabilen dost ateşi
- Oda sahibinin seçebildiği 15/25/40 saniye tur, 75/100/150 can, rüzgâr, sandık sıklığı ve ani ölüm kuralları
- Merkez bölgesinde üç tur tutunmaya dayalı Kontrol Noktası modu
- Rakibe isabet ettikçe sıradaki silaha geçilen, düşen oyuncuların yeniden doğduğu sekiz aşamalı Silah Yarışı
- Her tur düşük çekim, fırtına, dev patlama, sekme veya kör atış kuralı getiren Kaos modu
- Arena temasına göre değişen engebeli tepeler, vadiler, yokuş sınırı ve yürüyüş/toz animasyonu
- Masaüstü ve mobil uyumlu arayüz
- Klavye, dokunmatik ve fare kontrolleri
- Düşük güçlü cihazlarda otomatik 30 FPS; diğer cihazlarda 60 FPS performans profili
- Yalnızca arazi değiştiğinde yenilenen önbellekli zemin katmanı ve yükseklik haritası
- Brotli/gzip sıkıştırması, sürümlü asset önbelleği ve maç başında gecikmeli görsel yükleme
- WebSocket geri basınç koruması, azaltılmış hareket mesajları ve kullanılmayan oda temizliği

## Çalıştırma

Node.js 20 veya üzeri gerekir.

```powershell
npm.cmd install
npm.cmd start
```

Tek başına çalıştırırken `http://localhost:8080` adresini açın. Atify production kurulumu oyunu `https://atify.com.tr/Yenicag/` adresinde yayınlar. Çevrim içi testi aynı adresi iki ayrı tarayıcı sekmesinde açarak yapabilirsiniz.

## Test

```powershell
npm.cmd test
```

Ayrıntılı ölçümler ve performans bütçeleri için `PERFORMANCE.md` dosyasına bakın.

## Kontroller

- Açı: Yukarı / Aşağı okları veya açı sürgüsü
- Güç ve ateş: Boşluğu veya ATEŞ düğmesini basılı tutun, istediğiniz güçte bırakın
- Hareket: A / D veya oyun alanındaki yön düğmeleri
- Zıplama: W veya yukarı ok düğmesi; havadayken A / D ile yön verilebilir
- Oyun alanında fareyi gezdirerek nişan alın; basılı tutup bırakarak ateş edin

## Yayına alma

Sunucu `PORT` ve `HOST` ortam değişkenlerini destekler. HTTPS arkasında çalıştırıldığında istemci otomatik olarak güvenli `wss://` bağlantısı kullanır. Üretimde Caddy veya Nginx üzerinden TLS sonlandırması yapılmalıdır.

Bu proje başka bir oyunun adını, karakterlerini, haritalarını veya görsel varlıklarını kullanmaz; yalnızca fizik tabanlı sıra tabanlı arena türünden ilham alan özgün bir prototiptir.

## Görsel varlıklar

Üretimde kullanılan optimize edilmiş web varlıkları `public/assets/` klasöründedir. Oyun yalnızca seçilen arenanın WebP görselini kullanır ve savaşçı atlasları tarayıcı önbelleğinde tutulur.
