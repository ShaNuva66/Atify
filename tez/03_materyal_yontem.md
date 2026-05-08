# 3. MATERYAL VE YÖNTEM

Bu bölümde, Atify projesinin geliştirilmesinde kullanılan donanım,
yazılım, veri seti ve geliştirme metodolojisi sistematik bir biçimde
ele alınmıştır. Bölüm, FAIR (Findable, Accessible, Interoperable,
Reusable) veri yönetimi ilkelerine [10] uygun bir
biçimde yapılandırılmıştır.

## 3.1. Geliştirme Ortamı

### 3.1.1. Donanım

Geliştirme süreci aşağıdaki donanım üzerinde yürütülmüştür:

- **Yerel geliştirme:** Windows 11 Home 24H2 işletim sistemli, Intel
  Core i7 sınıfı işlemci, 16 GB RAM bellek konfigürasyonuna sahip
  taşınabilir bilgisayar.
- **Üretim sunucusu:** 2 sanal CPU, 4 GB RAM, 80 GB SSD
  yapılandırmasına sahip Linux VPS sunucusu (`89.47.113.106`).
  Sunucu, Türkiye merkezli barındırma sağlayıcısından kiralanmış olup
  `atify.com.tr` alan adıyla eşleştirilmiştir.

Üretim sunucusunun kasıtlı olarak mütevazı kaynak yapılandırmasına
sahip olması, sistemin kaynak verimliliği açısından
ölçeklenebilirliğini değerlendirmeye olanak tanımaktadır.

### 3.1.2. İşletim Sistemleri

- Yerel geliştirme: Windows 11 + Git Bash + PowerShell 5.1
- Üretim: Ubuntu 22.04 LTS (sunucu)
- Konteyner taban imajları: `eclipse-temurin:17-jre`,
  `python:3.11-slim`, `mysql:8.4`, `caddy:2.8-alpine`

## 3.2. Yazılım Yığını

### 3.2.1. Backend (Spring Boot)

Backend bileşeni, Java tabanlı modern web çerçevesi Spring Boot
kullanılarak geliştirilmiştir. Ana sürümler ve kütüphaneler
Çizelge 3.1'de listelenmiştir.

**Çizelge 3.1.** Backend yazılım bağımlılıkları.

| Bileşen | Sürüm | Kullanım Amacı |
|---|---|---|
| Java | 17 (LTS) | Çalıştırma platformu |
| Spring Boot | 3.5.3 | Web çerçevesi, otomatik yapılandırma |
| Spring Data JPA | 3.x | ORM ve veri erişim katmanı |
| Hibernate | 6.x | JPA uygulaması |
| Spring Security | 6.x | Kimlik doğrulama ve yetkilendirme |
| jjwt | 0.11.5 | JWT üretimi/doğrulaması |
| Lombok | 1.18.x | Kod tekrarını azaltma |
| MySQL Connector/J | 8.x | Veri tabanı sürücüsü |
| Springdoc OpenAPI | 2.x | API dokümantasyonu |
| Micrometer | 1.x | Metrik toplama |
| Jackson | 2.x | JSON serileştirme |

### 3.2.2. Recognizer (Python)

Akustik parmak izi hesaplaması ve eşleştirme işlemleri, Python tabanlı
ayrı bir mikroservis tarafından üstlenilmektedir. Çizelge 3.2'de bu
servisin bağımlılıkları yer almaktadır.

**Çizelge 3.2.** Recognizer servisi yazılım bağımlılıkları.

| Bileşen | Sürüm | Kullanım Amacı |
|---|---|---|
| Python | 3.11 | Çalıştırma dili |
| Flask | 3.x | HTTP sunucusu |
| NumPy | 1.26.x | FFT, dizi işlemleri |
| ffmpeg | 6.x | Ses kod dönüşümü |

### 3.2.3. Veri Tabanı ve Önbellek

- **MySQL 8.4:** Birincil veri tabanı. UTF-8 karakter seti
  (`utf8mb4`), InnoDB tablo motoru.
- **Redis (isteğe bağlı):** Önbellekleme katmanı; varsayılan
  konfigürasyonda devre dışıdır, üretimde bellek içi (in-memory)
  önbellek kullanılmaktadır.

### 3.2.4. Ön Yüz (Frontend)

Atify ön yüzü, herhangi bir derlenmiş çerçeve (React, Vue vb.)
kullanmadan, tarayıcı yerel teknolojileriyle (HTML5, vanilla
JavaScript ES6, CSS3) geliştirilmiştir. Bu seçim, üç gerekçeye
dayanmaktadır:

1. Bitirme tezinin **algoritma ve mimari** odağını sulandırmamak
   için ön yüz karmaşıklığının asgaride tutulması.
2. Build adımı (webpack, Vite vb.) gerektirmediği için dağıtım
   pipeline'ının basitleşmesi.
3. Kullanılan tarayıcı API'lerinin (MediaRecorder, getUserMedia)
   *raw* hâlinde gözlemlenebilmesi; tez literatür incelemesi
   bağlamında pedagojik bir avantaj sağlaması.

### 3.2.5. Ters Vekil ve TLS

Caddy 2.8 ters vekil sunucusu kullanılmıştır. Caddy:

- 80 ve 443 numaralı portları dinler.
- Let's Encrypt üzerinden otomatik TLS sertifikası alır ve yeniler.
- HTTP isteklerini HTTPS'e yönlendirir.
- Statik dosyaları doğrudan Spring Boot'un static kaynaklar üzerinden
  servis eder.

### 3.2.6. Konteynerleştirme

Tüm yığın `docker-compose.prod.yml` dosyasında tanımlı dört
konteyner üzerinde çalışmaktadır. Bileşenler `bridge` türü tek
bir Docker ağı üzerinden iç DNS ile haberleşmektedir.

## 3.3. Veri Seti ve FAIR Yönetimi

### 3.3.1. Şarkı Kaynağı: Jamendo

Atify'da kullanılan müzik kataloğu, Jamendo Music tarafından sunulan
ve büyük çoğunluğu Creative Commons (CC-BY, CC-BY-SA, CC-BY-NC)
lisansları ile yayımlanmış olan açık katalogdan alınmıştır. Jamendo
Developer API'si üzerinden, `JamendoService` adlı backend bileşeni
aracılığıyla aşağıdaki etiketler için ön yükleme (preload)
yapılmaktadır:

- `instrumental`
- `chill`
- `lofi`

Tez kapsamında dolaşım hâlindeki katalog 60-70 şarkı boyutundadır;
ancak sistem mimarisinin binler ölçeğine kadar herhangi bir tasarım
değişikliği gerektirmediği Bölüm 6'da gösterilmiştir.

### 3.3.2. FAIR İlkeleri ile Eşleme

| Prensip | Atify Uygulaması |
|---|---|
| **Findable** | Her şarkıya benzersiz `songCode` atanmaktadır. Katalog `GET /catalog-status` uç noktası üzerinden boyut bilgisiyle birlikte sorgulanabilir. |
| **Accessible** | Tüm REST uç noktaları açık standart HTTPS üzerinden erişilebilir; kimlik doğrulama gerektirmeyen `/health` ve `/catalog-status` uç noktaları doğrudan kullanılabilir. |
| **Interoperable** | JSON tabanlı standart REST sözleşmesi, OpenAPI 3 dokümantasyonu, açık kaynak format `pcm_s16le` ses verisi. |
| **Reusable** | Açık lisans (MIT) altında yayımlanacak kaynak kod, CC-BY tabanlı şarkı kataloğu, parmak izi vektörlerinin sürüm bilgisiyle (`fpVersion=2`) etiketlenmesi. |

### 3.3.3. Telif Hakkı Uyumluluğu

Yalnızca açık lisanslı içeriklerin kataloğa eklenmesini güvence
altına almak amacıyla, sistem üç katmanda kontrol uygulamaktadır:

1. Backend tarafında `app.rights.enforce-local-stream-verification`
   bayrağı (varsayılan: `true`) ile yerel akış doğrulaması.
2. Şarkı yükleme sırasında lisans bilgisinin metaveriye eklenmesi.
3. Jamendo API üzerinden çekilen şarkılarda lisans alanının
   kalıcı olarak veri tabanına yazılması.

## 3.4. Geliştirme Metodolojisi

### 3.4.1. Sürüm Kontrolü

Proje, Git üzerinde sürümlenmektedir. Uzak depo
(`Atify_projesi/master` adlı remote) üzerinde tutulan ana dal
(master), üretim sürümünü temsil etmektedir. Anlamlı her değişiklik
*atomik bir commit* hâlinde uygulanmıştır. Tez yazımı sırasında
yapılan üç kritik düzeltme aşağıdaki commit'lerle dağıtılmıştır:

- `7ddd830 fix(fingerprint): v2 algo + dynaudnorm filter + auto-reindex`
- `230bce5 fix(recognizer): thread-safe CATALOG access`
- `b4e37be fix(catalog): skip reset on incremental sync`

Bu commit'ler, Bölüm 6.4'te sunulan operasyonel sorun günlüğünün
birincil delillerini oluşturmaktadır.

### 3.4.2. Sürekli Teslim (Continuous Delivery)

Üretim ortamına dağıtım, projede `ops/sync-prod.ps1` dosyasında yer
alan PowerShell betiği ile yapılmaktadır. Betiğin akışı şu adımları
içermektedir:

1. `git archive HEAD` komutuyla anlık kaynak kod arşivinin oluşturulması.
2. SCP ile arşiv ve `.env.prod` dosyasının üretim sunucusuna
   yüklenmesi.
3. Sunucu tarafında `tar -xf` ile açılması ve
   `deploy/start-prod.sh` betiğinin çalıştırılması.
4. `docker compose -f docker-compose.prod.yml up -d --build
   --remove-orphans` çağrısıyla değişen imajların yeniden derlenmesi
   ve gerekiyorsa konteynerlerin yeniden oluşturulması.

Tez yazımı sırasında bu pipeline ortalama 6-10 dakika sürede
uçtan uca tamamlanmaktadır.

### 3.4.3. Otomatik Test Altyapısı

Spring Boot projesi içinde JUnit 5 + Mockito + Spring Test çatıları
kullanılmaktadır. Toplam **35 birim ve entegrasyon testi** yer
almakta; tezin teslim tarihinde tüm testler başarıyla geçmektedir.
Testler şu kategorilerde yer almaktadır:

- Servis katmanı birim testleri (`SongServiceTest`,
  `ArtistServiceTest`, vb.)
- Güvenlik erişim testleri (`SecurityAccessTests`) — JWT olmayan
  isteklerin hangi uç noktalarda 401 döndürmesi gerektiğini
  doğrulayan 14 test.
- Tavsiye servisi testleri (`RecommendationServiceTests`)
- Tüm uygulama bağlamının ayağa kalktığını doğrulayan smoke test
  (`BackendApplicationTests`).

### 3.4.4. Gözlemlenebilirlik

Üretim sisteminin çalışma durumu üç katmanda izlenmektedir:

- **Sağlık uçları:** Spring Actuator `/actuator/health` ile
  recognizer servisinin `/health` uç noktası periyodik olarak
  sorgulanmaktadır.
- **Yapısal günlük kaydı:** Tüm bileşenler Logback aracılığıyla
  yapısal günlük kaydı üretmekte; Docker `docker logs` komutu
  üzerinden merkezi olarak okunmaktadır.
- **Metrik altyapısı:** Micrometer + Prometheus formatında
  `/actuator/prometheus` uç noktası açıktır; ileri çalışma olarak
  Grafana panosu eklenmesi planlanmaktadır.

## 3.5. Algoritmanın Doğrulanması İçin Yöntem

Akustik parmak izi algoritmasının doğruluğu Bölüm 6'da iki yolla
ölçülmüştür:

1. **Yüksek kaliteli kaynak (synthetic) testi:** Katalogdaki bir
   şarkının orijinal MP3 dosyasından 12 saniyelik bir kesit
   alınarak doğrudan recognizer'a beslenmesi. Bu test **alt sınır**
   doğruluğu (catalog round-trip recognition) ölçer.
2. **Mikrofon testi (real-world test):** Aynı şarkının yüksek sesle
   çalınıp dizüstü mikrofonu ile kaydedilmesi. Bu test **üst sınır
   gürültü dayanıklılığını** ölçer.

Her iki testte de `recognize-simple` API uç noktasının döndürdüğü
`offsetMatches`, `sharedHashes` ve `offsetRatio` değerleri
kayıt altına alınmıştır.

## 3.6. Etik Hususlar

- Çalışmada herhangi bir insan deneği verisi (anketler, ses kaydı
  külliyatı vb.) kullanılmamış; bu nedenle Helsinki Deklarasyonu
  kapsamında etik kurul izni gerekmemektedir.
- Tezde gösterilen tüm kullanıcı verileri (kullanıcı adı, profil
  bilgileri vb.) **örnek hesaplara** aittir; gerçek kullanıcı
  bilgisi paylaşılmamaktadır.
- Şarkı kataloğunun tamamı CC-tabanlı açık lisans altındadır;
  herhangi bir telif hakkı ihlali bulunmamaktadır.
- Tez yazımı sürecinde ChatGPT ve Claude gibi üretken yapay zekâ
  araçlarından **dil çevirisi** ve **kod yorumlama** desteği
  alınmıştır. Bu kullanım, tez kapağındaki "Üretken Yapay Zekâ
  Kullanım Beyanı" altında ayrıntılı olarak belirtilmiştir.
