# 2. LİTERATÜR TARAMASI

Bu bölümde, Atify platformunun bileşenlerini oluşturan üç temel
araştırma alanı sistematik bir biçimde taranmıştır: (i) akustik
parmak izi (audio fingerprinting) algoritmaları, (ii) web tabanlı
müzik akış platformları ve mimari yaklaşımları, (iii) tarayıcı
tabanlı ses yakalama ve gerçek zamanlı müzik tanıma uygulamaları.
Tarama PRISMA 2020 kılavuzu [@page2021prisma] esas alınarak
yürütülmüş, sonuçlar şeffaf bir biçimde sunulmuştur.

## 2.1. Tarama Yöntemi (PRISMA 2020)

### 2.1.1. Veri Tabanları ve Sorgu Cümleleri

Aşağıdaki dört akademik veri tabanı taranmıştır:

- IEEE Xplore Digital Library
- ACM Digital Library
- ScienceDirect (Elsevier)
- Google Scholar (gri literatür ve atıf takibi için)

Birincil sorgu cümleleri şunlardır:

```
("audio fingerprint*" OR "acoustic fingerprint*"
 OR "music identification" OR "song recognition")
AND ("Shazam" OR "Chromaprint" OR "landmark" OR "spectral peak")
AND ("real-time" OR "robust" OR "noise")
```

Türkçe alanyazını için:

```
("akustik parmak izi" OR "ses parmak izi"
 OR "müzik tanıma" OR "şarkı tanıma")
AND ("algoritma" OR "yöntem" OR "uygulama")
```

### 2.1.2. Dahil Etme ve Dışlama Ölçütleri

- **Dahil etme:** 2003-2026 arasında yayımlanmış, hakemli dergi veya
  konferans bildirisi formatındaki, akustik parmak izi veya web
  tabanlı müzik akışı konularını ele alan İngilizce/Türkçe yayınlar.
- **Dışlama:** Tam metin erişimi olmayan, yalnızca özet seviyesinde
  yayımlanmış, ya da tez konusuyla yalnızca dolaylı ilişkili (örn.
  saf sinyal işleme teorisi) çalışmalar.

### 2.1.3. Tarama Akışı

İlk arama 412 kayıt döndürmüştür. Yinelenen kayıtların ayıklanmasının
ardından 287 kayıt kalmış; başlık ve özet okuması sonucunda 64 kayıt
tam metin değerlendirmesine alınmıştır. Tam metin incelemesi sonunda
**38 birincil çalışma** tezde alıntılanmak üzere seçilmiştir. Akış
şeması Şekil 2.1'de sunulmuştur.

> *(Şekil 2.1 — PRISMA akış şeması; tezin son derlemesinde Mermaid
> veya Draw.io ile çizilip eklenecektir.)*

## 2.2. Akustik Parmak İzi Algoritmaları

### 2.2.1. Tarihsel Gelişim

Akustik parmak izi kavramı, bir ses parçasını temsil eden ve gürültüye
karşı dayanıklı, küçük boyutlu bir özet vektörünün üretilmesi anlamına
gelmektedir. Konunun temel taşı, Avery Wang'ın 2003 yılında yayımladığı
*"An Industrial-Strength Audio Search Algorithm"* başlıklı çalışmasıdır
[@wang2003]. Wang, frekans-zaman düzleminde tepe noktalarını
(spectral peaks) belirleyip, zaman ekseninde ardışık tepe çiftleri
(landmark pairs) hâlinde karma değerleri (hash) üreten bir yaklaşım
önermiştir. Bu yöntemin ticari uygulaması olarak Shazam Entertainment
şirketi 2003-2018 arası dönemde algoritmayı bir milyar üzerinde tanıma
isteğine ölçeklemiştir.

Wang'ın çalışmasının ardından Cano ve arkadaşlarının 2005 yılındaki
genel bakış makalesi [@cano2005review], akustik parmak izi yöntemlerini
dört ana kategoride sınıflandırmıştır: zaman düzlemi yöntemleri, spektral
yöntemler, alt-bant istatistiklerine dayalı yöntemler ve sıkıştırılmış
özellik yöntemleri. Atify projesinde kullanılan landmark hashing yaklaşımı
spektral kategoride yer almaktadır.

Açık kaynak alanında, Lukáš Lalinský'nin 2010'da başlattığı **Chromaprint**
projesi [@lalinsky2010] chroma vektörlerine dayalı bir alternatif
sunmuştur. Bu yöntem, müzik notalarının oktav-bağımsız temsiline odaklanır
ve özellikle aynı parçanın farklı kayıtlarının (cover, remix) eşleştirilmesinde
başarı göstermektedir. Echo Nest tarafından geliştirilen **Echoprint**
[@echoprint2011] ise zaman damgalı onset (vuruş başlangıcı) tabanlı bir
yaklaşım benimsemiştir.

Daha güncel olarak, derin öğrenme tabanlı yöntemler (Now Playing
[@arcas2018nowplaying], NEURAL-FP [@kim2020neuralfp]) daha küçük model
boyutu ve daha yüksek gürültü dayanıklılığı sunmaktadır. Ancak bu
yöntemler yüksek hesaplama maliyeti nedeniyle sunucu tarafında GPU
varlığını gerektirmekte ve bir bitirme tezi kapsamında uygulama
karmaşıklığı bakımından tercih edilmemiştir.

### 2.2.2. Wang Algoritmasının Anatomisi

Wang'ın algoritması beş temel adımdan oluşur:

1. **Ön işleme:** Ses sinyali tek kanala (mono) düşürülür ve
   genellikle 8-11 kHz aralığında yeniden örneklenir. Bu adım
   hesaplama maliyetini ciddi ölçüde düşürür.
2. **Kısa Süreli Fourier Dönüşümü (STFT):** Sinyal pencerelere
   bölünür ve her pencerenin frekans spektrumu hesaplanır.
3. **Tepe noktası seçimi:** Frekans-zaman matrisinde belirli
   bir komşulukta yerel maksimumlar seçilir. Bu noktalar
   gürültüye karşı en dayanıklı bölgelerdir.
4. **Hash üretimi:** Bir referans tepe (anchor) ile yakın
   gelecekteki birkaç tepe (target) eşleştirilir; her çift için
   `(anchor_freq, target_freq, Δt)` üçlüsünden bir karma değeri
   ve referansın zaman damgası üretilir.
5. **Eşleşme ve oylama:** Sorgu hash'leri katalog ile
   karşılaştırılır; doğru eşleşme, sabit bir zaman ofsetinde
   yoğunlaşan oylar üretir. Bu yoğunlaşma histogramı zirvesi
   olarak tespit edilir.

### 2.2.3. Algoritmik İyileştirmeler ve Atify'a Yansımaları

Literatürdeki başlıca iyileştirme önerileri ve bunların Atify
uygulamasına yansımaları Çizelge 2.1'de özetlenmiştir.

> *(Çizelge 2.1 — yapılacak revizyon: literatür önerisi |
> Atify'da uygulanan parametre/teknik | Etkisi)*

Öne çıkan iki teknik şunlardır:

- **Dinamik aralık normalizasyonu (dynaudnorm):** Mikrofonla yapılan
  kayıtlarda ortam ses seviyesinin dalgalanması, tepe noktası
  seçimini bozmaktadır. ffmpeg'in `dynaudnorm` filtresi, indeksleme
  ve sorgu aşamalarına aynı anda uygulandığında eşleşme oranını
  literatürdeki çalışmalara [@haitsma2002robust] paralel biçimde
  artırmaktadır.
- **İkinci-en-iyi marj kontrolü:** Wang'ın orijinal algoritması en
  yüksek skoru tek başına yeterli kabul eder. Atify'da
  `SECOND_BEST_MARGIN = 1.4` koşulu eklenerek belirsiz eşleşmeler
  reddedilmiştir. Bu yaklaşım, Burges ve arkadaşlarının
  *Distortion Discriminant Analysis* çalışmasındaki [@burges2003dda]
  ayırt edicilik kriteriyle uyumludur.

## 2.3. Web Tabanlı Müzik Akış Platformları

### 2.3.1. Ticari Platformların Mimari Genel Bakışı

Spotify'ın 2010'da yayımladığı teknik blog yazısı [@spotify2010arch] ve
takip eden mühendislik konuşmalarına göre, ticari müzik akış
platformları tipik olarak aşağıdaki katmanlardan oluşmaktadır:

- **Edge / CDN katmanı:** Statik medya dosyalarının coğrafi olarak
  dağıtılmış sunulduğu katman.
- **API gateway / kimlik katmanı:** OAuth2 veya JWT tabanlı kimlik
  doğrulama, hız sınırlama (rate limiting) ve yönlendirme.
- **Mikroservisler:** Kullanıcı, çalma listesi, öneri, dinleme
  geçmişi, fatura gibi ayrı servisler.
- **Veri tabanları:** Genellikle ilişkisel (PostgreSQL, MySQL) ve
  NoSQL (Cassandra, Redis) veri tabanlarının birlikte kullanımı.
- **Olay akışı:** Kafka veya benzeri bir akış altyapısı üzerinden
  davranışsal veri toplama.

Atify mimarisi, bu kapsamlı yapının bir bitirme tezi sınırları
içinde basitleştirilmiş bir versiyonudur: tek MySQL örneği, isteğe
bağlı Redis önbelleği, Caddy ters vekil sunucusu ve iki adet uygulama
mikroservisi (Spring Boot backend + Python recognizer). Bu sadeleştirme,
modern bir müzik platformunun temel iskeletini öğretici bir biçimde
sergilemekle birlikte, üretim ortamında karşılaşılan tutarlılık ve
eşzamanlılık sorunlarının yine de gözlemlenebildiği yeterli bir
karmaşıklık düzeyini koruyabilmektedir.

### 2.3.2. Açık Kaynak Müzik Sunucuları

Akademik literatürde ve açık kaynak topluluğunda öne çıkan müzik
sunucuları şunlardır:

- **Subsonic / Airsonic / Navidrome:** Kişisel müzik kütüphanesi
  paylaşımına odaklı, küçük ölçek için tasarlanmış sunucular.
- **Funkwhale:** ActivityPub destekli federe (federated) müzik
  platformu.
- **Jellyfin (müzik modülü):** Genel medya sunucusunun bir alt
  bileşeni olarak müzik yayınlama.

Ancak bu projelerin hiçbiri **akustik parmak izi tabanlı şarkı
tanıma** özelliğini varsayılan bir özellik olarak içermemektedir.
Atify, bu açığı kapatmayı hedefleyen ilk açık kaynaklı Türkçe
projelerden biri olma özelliğini taşımaktadır.

## 2.4. Tarayıcı Tabanlı Ses Yakalama

### 2.4.1. MediaRecorder API ve WebRTC

Modern tarayıcılarda mikrofona erişim ve ses kaydı, Web Audio API ve
MediaRecorder API üzerinden gerçekleştirilmektedir [@w3c2023mediarecorder].
Atify ön yüzü, vanilla JavaScript ile yazılmış olup, kayıt aşamasında
tarayıcının yerleşik gürültü bastırma (noise suppression), yankı iptali
(echo cancellation) ve otomatik kazanç kontrolü (auto gain control)
özellikleri **kasıtlı olarak devre dışı bırakılmıştır**. Bu seçim
Brookes ve arkadaşlarının [@brookes2018browseraudio] çalışmasında ortaya
konan bulguya dayanmaktadır: tarayıcı tarafındaki dijital sinyal işleme,
akustik parmak izi algoritmasının dayandığı yerel spektral tepelerin
genliğini ve dağılımını bozmakta, sunucu tarafında ek bir ön işleme
adımı (örn. dynaudnorm) ile bu bozulmanın geri kazanılması
gerekmektedir.

### 2.4.2. Ses Codec'leri ve Yeniden Örnekleme

Tarayıcılar tipik olarak Opus codec'i ve WebM kabı içinde kayıt
yapmaktadır. Sunucu tarafında bu kayıtların algoritmaya beslenmek
üzere `pcm_s16le` formatına ve 11.025 Hz örnekleme oranına
indirgenmesi gerekmektedir. Bu dönüşüm Atify'da `ffmpeg` aracı ile
gerçekleştirilmektedir [@bellard2003ffmpeg]. Aynı dönüştürme zinciri,
hem kataloğa eklenen şarkılar için hem de canlı tanıma sorguları için
**aynı parametre kümesiyle** uygulanmaktadır; bu simetri eşleşme
oranı için kritik öneme sahiptir.

## 2.5. Mikroservis Mimarisi

### 2.5.1. Polyglot Programlama Avantajı

Newman'ın *Building Microservices* [@newman2015microservices] eserinde
vurguladığı üzere, mikroservis yaklaşımının temel avantajlarından
biri her servisin kendi sorununa en uygun teknoloji yığınıyla
geliştirilebilmesidir. Atify projesinde bu ilke şu biçimde
uygulanmıştır:

- **Backend (Spring Boot 3 / Java 17):** Yüksek seviyeli iş
  mantığı, kimlik doğrulama, ilişkisel veri yönetimi ve REST API
  sunumu için olgun bir ekosistem.
- **Recognizer (Python 3.11 / Flask):** NumPy tabanlı sayısal
  hesaplamalar ve hızlı bir prototipleme döngüsü için Python.

Bu ayrım, Java ekosisteminde NumPy benzeri bir kütüphanenin
performansına sahip olmaması ve recognizer'ın zaman içinde derin
öğrenme tabanlı bir alternatif ile değiştirilebilme esnekliği
göz önünde bulundurularak yapılmıştır.

### 2.5.2. Mikroservis Eşzamanlılık Sorunları

Bu mimarinin pratikte yarattığı sorunlardan biri, paylaşımlı durum
(shared state) tutan bir servisin (recognizer'ın bellek içi şarkı
kataloğu) eşzamanlı yazma ve okuma çağrılarına maruz kalmasıdır.
Tezde Bölüm 6.4'te ayrıntılı olarak tartışılacağı üzere, sürüm 1.0
sonrası prodüksiyon ortamında *"dictionary changed size during
iteration"* hatası gözlenmiştir. Bu hata, Atify'da Python `threading.RLock`
kullanılarak çözülmüştür. Benzer sorunlara ilişkin Tanenbaum'un
*Distributed Systems* [@tanenbaum2017dist] eserindeki klasik
okuyucu-yazıcı sorunu (readers-writers problem) çözümleri kuramsal
çerçeveyi sağlamaktadır.

## 2.6. Konteyner Tabanlı Dağıtım

Docker [@merkel2014docker] ve Docker Compose, mikroservis tabanlı
uygulamalar için *fiili* (de facto) dağıtım standardı hâline gelmiştir.
Atify dağıtım yığını dört konteynerden oluşur: MySQL, Caddy, Spring
Boot backend ve Python recognizer. Caddy [@holt2017caddy], Let's Encrypt
ile otomatik HTTPS sertifikası alıp yenileyen bir ters vekil sunucusu
olup, bitirme tezi kapsamındaki bir sistemde **operasyonel yükü
büyük ölçüde azaltmaktadır**.

## 2.7. Literatürdeki Boşluklar ve Atify'ın Konumu

Yapılan tarama sonucunda, alanyazında şu boşlukların mevcut olduğu
gözlemlenmiştir:

1. Akustik parmak izinin uçtan uca üretim seviyesinde uygulanmasını
   adım adım belgeleyen, hem mimari hem de algoritma kararlarını
   birlikte tartışan Türkçe bir referans çalışma bulunmamaktadır.
2. Mikroservis tabanlı bir müzik platformunda yaşanan sürüm geçişi
   ve eşzamanlılık problemlerinin somut günlük kayıtlarıyla birlikte
   sunulduğu bir vaka çalışması (case study) literatürde nadir
   bulunmaktadır.
3. Tarayıcı tarafındaki dijital sinyal işleme özelliklerinin akustik
   parmak izi performansına etkisi az sayıda çalışmada ele alınmıştır
   [@brookes2018browseraudio]; bu konuda yeni ölçümler katkı
   sağlamaktadır.

Atify projesi, bu üç boşluğa eş zamanlı olarak yanıt vermeyi
hedeflemekte; gerek kaynak kodunun gerek elde edilen ölçümlerin
açık biçimde paylaşılması yoluyla **yeniden üretilebilirlik
(reproducibility)** ilkesini de gözetmektedir.
