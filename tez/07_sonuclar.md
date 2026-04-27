# 7. SONUÇLAR VE ÖNERİLER

Bu tez kapsamında, akustik parmak izi tabanlı şarkı tanıma
özelliğine sahip web tabanlı bir müzik akış platformu olan
**Atify** uçtan uca tasarlanmış, geliştirilmiş ve üretim ortamına
dağıtılmıştır. Bu bölümde, tez başında belirlenen amaçlar ile
elde edilen sonuçlar karşılaştırılmakta; öğrenilen dersler
özetlenmekte ve gelecek çalışmalar için somut öneriler
sunulmaktadır.

## 7.1. Elde Edilen Sonuçlar

### 7.1.1. Tezin Amacına Ulaşma Düzeyi

Bölüm 1.2'de belirlenen alt amaçlar ve bu tezde gerçekleştirilen
durumları aşağıdaki tabloda özetlenmiştir:

**Çizelge 7.1.** Tez amaçları ve gerçekleştirme durumu.

| Amaç | Durum | Gerçekleşme Kanıtı |
|---|---|---|
| Spring Boot ekosisteminin müzik platformu üzerinde uygulanması | Tamamlandı | 35 test geçen Spring Boot 3.5.3 backend |
| Wang algoritmasının Türkçe literatürde belgelenmesi | Tamamlandı | Bu tez Bölüm 5 |
| Mikroservis mimarisinin pratik avantaj/dezavantajlarının deneyimlenmesi | Tamamlandı | Bölüm 6.4 sorun günlüğü |
| Sürekli teslim (CI/CD) iş akışı | Tamamlandı | `sync-prod.ps1` + Docker Compose |
| Üretim sorunlarının kalıcı çözümü | Tamamlandı | 3 commit (`7ddd830`, `230bce5`, `b4e37be`) |
| Açık kaynak yayını + veri seti paylaşımı | Tez teslimiyle eş zamanlı | GitHub + Zenodo (planlanmıştır) |

### 7.1.2. Sayısal Sonuçlar

- **Geliştirilen backend kod tabanı:** 100+ Java sınıfı, 35 test
- **Recognizer kod tabanı:** Tek dosya, ~400 satır Python
- **Veri tabanı:** 10 ana varlık tablosu, 67 fingerprintable şarkı
- **Tanıma doğruluğu:** Synthetic testte 10/10 başarı; mikrofon
  testinde gürültü kontrolünden sonra başarılı
- **Tanıma gecikmesi:** Kayıt süresi hariç ~1 saniye
- **Üretim erişimi:** `https://atify.com.tr` 7/24 erişilebilir

### 7.1.3. Literatüre Sağlanan Katkı

Bölüm 1.3'te belirlenen literatür katkıları aşağıdaki şekilde
gerçekleşmiştir:

1. **Türkçe akademik kaynak:** Bu tez, Wang'ın landmark hashing
   algoritmasını Türkçe terimlerle bütünüyle ele alan az sayıdaki
   akademik çalışmadan biri olmuştur.
2. **Üretim seviyesinde uygulama belgesi:** Atify, kamuya açık
   alan adı üzerinde çalışan, Docker Compose ile yönetilen ve
   otomatik HTTPS sertifikalı tam yığın bir referans uygulamadır.
3. **Operasyonel sorun günlüğü:** Bölüm 6.4'te ele alınan üç sorun,
   benzer sistemlerin geliştirilmesinde karşılaşılabilecek somut
   tuzakları belgeler.
4. **FAIR ilkelerine uygun açık veri:** Tez ekinde paylaşılan
   şarkı kataloğu, parmak izi vektörleri ve değerlendirme
   betikleri, sonraki araştırmacılar için yeniden üretilebilir
   bir temel sağlamaktadır.

## 7.2. Öğrenilen Dersler

### 7.2.1. Mimari Düzeyinde

- **Mikroservislerin getirdiği esneklik bedelsiz değildir.** Atify'da
  ortaya çıkan üç sorunun da kökeni, iki bağımsız servis arasındaki
  durum (state) eşgüdümünden kaynaklanmıştır. Tek hizmetli
  (monolitik) bir mimaride bu sorunların hiçbiri ortaya
  çıkmayacaktı; ancak bunun karşılığında recognizer'ın bağımsız
  geliştirme ve dağıtım hızı kaybedilirdi.
- **Idempotent uç nokta tasarımı**, eşzamanlı sistemlerde "tekrar
  dene"yi güvenli hâle getirir. Atify'ın
  `/register-fingerprint` uç noktasının idempotent olması,
  Bölüm 6.4.3'teki düzeltmenin temelini oluşturmuştur.

### 7.2.2. Algoritma Düzeyinde

- **Aynı parmak izi parametre seti, indeks ve sorgu yollarında
  simetrik biçimde uygulanmadığı sürece tanıma çöker.** Mikrofon
  kayıtlarının başarısız olmasının asıl nedeni dynaudnorm'un
  yalnızca tek tarafa uygulanmasıydı.
- **İkinci-en-iyi marj kontrolü, Wang algoritmasına yapılabilecek
  en ucuz ama en değerli eklemelerden biridir.** Tek satırlık bir
  karşılaştırma, yanlış-pozitif oranını dramatik biçimde
  düşürmektedir.

### 7.2.3. Süreç Düzeyinde

- **`git archive HEAD` ile yapılan deploy, commit disiplinini
  zorlamaktadır.** Geliştirici, dağıtım yapmadan önce her
  değişikliği commit etmek zorunda kalır; bu zorunluluk
  geriye doğru izlenebilirliği tabii olarak sağlar.
- **Üretim log'larını sürekli izlemek, geliştirme aşamasındaki
  birim testlerden farklı bir hata sınıfını ortaya çıkarmaktadır.**
  Üç sorunun da tespit yöntemi, yapılandırılmış log kayıtlarının
  okunmasıdır.

## 7.3. Sınırlamalar

Bu tezin bilgi alanına ilişkin başlıca sınırlamaları:

1. **Ölçek:** Tez kapsamında dolaşımdaki katalog 67 şarkı
   boyutundadır. Binler ölçeğindeki kataloglarda bellek
   tüketimi ve eşleştirme zamanlamalarının doğrusal şekilde
   ölçeklenip ölçeklenmediği deneysel olarak sınanmamıştır.
2. **Kullanıcı temelli değerlendirme:** Anketler ya da kullanılabilirlik
   testleri yapılmamıştır; UI/UX bulguları tek bir geliştiricinin
   gözlemlerinden elde edilmiştir.
3. **Çeşitlilik:** Test kullanılan müzik kataloğu büyük oranda
   `instrumental`, `chill` ve `lofi` etiketli parçalardan oluşmakta;
   yoğun vokal veya konuşma içeren kayıtlar üzerinde
   sınanmamıştır.
4. **Dağıtık ölçeklendirme:** Atify tek bir VPS üzerinde
   çalışmaktadır. Kubernetes ile yatay ölçeklendirme
   senaryoları kapsam dışı bırakılmıştır.

## 7.4. Gelecek Çalışmalar

### 7.4.1. Algoritma Düzeyinde Öneriler

- **Çoklu pencereli sorgu (multi-window query):** Tek bir 12 saniyelik
  sorgu yerine, kaydı 3-4 örtüşen pencereye bölüp her birini
  bağımsız sorgulamak; çoğunluk oylamasıyla nihai sonucu seçmek.
  Literatürdeki çalışmalar bu yöntemin gürültülü ortamlarda
  ~%30 doğruluk artışı sağladığını göstermektedir.
- **Adaptif `ENERGY_FLOOR_PERCENTILE`:** Ortam sinyal-gürültü
  oranına göre dinamik ayarlama; sessiz ortamlarda daha düşük
  eşik, gürültülü ortamlarda daha yüksek eşik.
- **MFCC veya Chroma ek özellikleri:** Wang hash'lerine paralel
  olarak MFCC vektörleri tutulması; cover ve remix versiyonlarının
  da tanınabilmesi.
- **Derin öğrenme tabanlı parmak izi:** NEURAL-FP [@kim2020neuralfp]
  veya benzeri bir modelin Atify'ın bir başka recognizer servisi
  olarak yan yana çalışması; A/B karşılaştırması.

### 7.4.2. Sistem Düzeyinde Öneriler

- **Async tanıma akışı:** Şu anda 12 saniyelik kayıt + ~1 saniyelik
  işleme blokludur. SSE (Server-Sent Events) veya WebSocket
  üzerinden parçalı sorgulama, kullanıcının "ilk eşleşmeyi"
  daha erken görmesine olanak tanır.
- **Tanıma günlükleme (recognition logging):** Her sorgunun
  metaverisinin (kullanıcı, hash sayısı, top match, skor)
  veri tabanına yazılması; ileride model eğitimi veya
  doğruluk analizi için altın değerinde bir veri seti
  oluşturulması.
- **Top-N sonuç gösterimi:** Kullanıcıya tek sonuç yerine
  ilk 3 aday + skor sunmak; yanlış eşleşmelerde manuel
  düzeltme imkânı sağlamak.
- **Öneri sistemi:** Dinleme geçmişi, favoriler ve katalog
  metaverisi üzerinden işbirlikçi filtre (collaborative filter)
  veya içerik tabanlı (content-based) öneri.
- **Üretim WSGI sunucusu:** Recognizer'ın Flask geliştirme
  sunucusundan `gunicorn` veya `uvicorn` benzeri üretim
  sunucusuna taşınması.

### 7.4.3. Güvenlik ve Uyum Önerileri

- **Hız sınırlama:** `/api/songs/recognize` uç noktasına
  IP başına dakikada 30 istek sınırı.
- **Refresh token rotasyonu:** Her yenileme sonrası eski
  refresh token'ın iptal edilmesi.
- **Ses dosyası doğrulama:** Yüklenen ses dosyalarının MIME
  tipi, süre ve örnekleme hızı bakımından doğrulanması.
- **Veri tabanı yedekleme:** MySQL `mysqldump` üzerinden
  zamanlanmış yedekleme + restore tatbikatı.

### 7.4.4. Tez Sonrası Akademik Çalışma Önerileri

- **Bildiri (konferans):** Bu tezdeki algoritma sürüm 2 parametre
  seçimleri ve mikrofon ortamı performans bulguları, ulusal bir
  konferansa (örn. UYMS, ASYU) bildiri olarak sunulabilir.
- **Açık kaynak duyurusu:** GitHub deposunun tanıtımı
  blog yazısı olarak yayımlanabilir.
- **Yeniden üretilebilir veri kümesi:** Tezde kullanılan parmak
  izi vektörleri ve değerlendirme betikleri Zenodo üzerinden
  DOI alarak paylaşılabilir.

## 7.5. Genel Değerlendirme

Atify projesi, bir lisans bitirme tezi sınırları içinde, ticari
düzeyde bir müzik akış platformunun temel bileşenlerini bir araya
getiren ve aynı zamanda akustik parmak izi gibi non-trivial bir
algoritmik bileşeni üretim seviyesinde uygulayan bütüncül bir
çalışmadır. Tezin sağladığı öğrenme deneyimi yalnızca yazılım
geliştirme tekniklerini değil, aynı zamanda **operasyonel
sorumluluk**, **canlı sistem izleme** ve **literatürle pratik
arasında köprü kurma** alanlarında da deneyim kazandırmıştır.

Çalışma boyunca alınan en önemli derslerden biri, **bir akademik
projenin "çalıştırılan" bir referans uygulama hâline geldiğinde
kazandığı somutluk** olmuştur. Yerel makinada çalışan bir
prototip, üretim ortamında binlerce dakika kesintisiz
çalıştığında ortaya çıkan tutarlılık problemleri, akademik
metinlerde ele alınan teorik konuların gerçek dünyada nasıl
yansıdığını net biçimde göstermiştir.
