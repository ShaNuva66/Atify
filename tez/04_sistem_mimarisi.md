# 4. SİSTEM MİMARİSİ VE TASARIMI

Bu bölümde, Atify platformunun bileşen düzeyindeki mimarisi, veri
tabanı şeması, REST API sözleşmesi ve dağıtım topolojisi
ayrıntılı olarak ele alınmıştır. Bölüm boyunca verilen şekiller,
sistemin uçtan uca akışını anlaşılır kılmak amacıyla soyutlama
seviyesi yüksekten alçağa doğru sıralanmıştır.

## 4.1. Genel Mimari

### 4.1.1. Bileşen Şeması

Atify üretim ortamında dört birincil konteyner bileşeninden
oluşmaktadır. Üst seviyeli akış şu biçimdedir:

```
[Tarayıcı]
   │  HTTPS (443)
   ▼
[Caddy ters vekil  +  Let's Encrypt TLS]
   │  HTTP (8080)
   ▼
[Spring Boot Backend]
   │           │
   │ JDBC      │ HTTP (5001)
   ▼           ▼
[MySQL 8.4] [Python Recognizer (Flask)]
```

> *(Şekil 4.1 — Sistem bileşen şeması; tezin son derlemesinde
> draw.io ile çizilip yerleştirilecektir.)*

Bileşenler arası iletişim şu şekilde özetlenebilir:

- **Tarayıcı ↔ Caddy:** HTTPS üzerinden REST/JSON ve statik
  varlıklar (HTML, JS, CSS, görseller).
- **Caddy ↔ Backend:** Saf HTTP, iç ağda; tüm uygulama akışı
  burada toplanır.
- **Backend ↔ MySQL:** JDBC üzerinden ilişkisel veri erişimi.
- **Backend ↔ Recognizer:** REST/JSON; üç temel uç nokta —
  `/fingerprint-file`, `/recognize-simple`, `/register-fingerprint`.

### 4.1.2. Sorumluluk Ayrımı

Atify mimarisinde her bileşen tek bir sorumluluğa odaklanır:

| Bileşen | Sorumluluk |
|---|---|
| Caddy | TLS sonlandırma, ters vekil, otomatik sertifika |
| Spring Boot Backend | İş mantığı, kimlik doğrulama, ilişkisel veri yönetimi, REST API |
| Python Recognizer | Akustik parmak izi üretimi ve sorgulama |
| MySQL | İlişkisel veri saklama (kullanıcı, şarkı, sanatçı, dinleme geçmişi) |
| Frontend (vanilla JS) | Kullanıcı arayüzü, mikrofon kaydı, REST tüketimi |

Bu ayrım sayesinde bir bileşendeki değişiklik (örneğin recognizer'ın
bir başka algoritmaya geçirilmesi) diğer bileşenleri etkilemeden
yapılabilmektedir.

## 4.2. Veri Tabanı Şeması

### 4.2.1. Varlık-İlişki Modeli

Atify veri tabanı 10 ana varlık tablosundan oluşmaktadır:

| Tablo | Açıklama |
|---|---|
| `user` | Kullanıcı hesapları, şifre özeti (BCrypt), rol bilgisi |
| `refresh_token` | Uzun ömürlü oturum yenileme jetonları |
| `artist` | Sanatçı bilgisi |
| `album` | Albüm bilgisi (opsiyonel) |
| `song` | Şarkı, sanatçı/albüm referansları, parmak izi alanları |
| `playlist` | Kullanıcı çalma listeleri |
| `favorite` | Kullanıcı-şarkı favori ilişkisi |
| `listening_history` | Dinleme geçmişi kayıtları |
| `audit_log` | Yönetimsel olay kayıtları |
| `app_setting` | Uygulama düzeyi anahtar-değer ayarları (örn. `fingerprint.version`) |

> *(Şekil 4.2 — ER diyagramı; tez son derlemesinde MySQL Workbench
> veya dbdiagram.io ile çıkarılacaktır.)*

### 4.2.2. Şarkı Tablosunun Tasarım Detayı

`song` tablosu, sistemin merkezindeki varlık olduğu için özel önem
taşımaktadır. Tablonun seçili sütunları Çizelge 4.1'de
gösterilmiştir.

**Çizelge 4.1.** `song` tablosunun seçili sütunları.

| Sütun | Tip | Açıklama |
|---|---|---|
| `id` | BIGINT, PK | Birincil anahtar |
| `name` | VARCHAR | Şarkı adı |
| `duration` | INT | Saniye cinsinden süre |
| `artist_id` | BIGINT, FK | Sanatçı referansı |
| `album_id` | BIGINT, FK, nullable | Albüm referansı (opsiyonel) |
| `file_name` | VARCHAR | Yerel dosya adı (yüklenen şarkılar için) |
| `audio_url` | VARCHAR | Harici şarkı bağlantısı (Jamendo) |
| `fingerprint_code` | VARCHAR, UNIQUE | Recognizer'a verilen kısa kod |
| `fingerprint_data` | LONGTEXT | Base64 kodlu, zlib sıkıştırılmış parmak izi vektörü |
| `cover_url` | VARCHAR | Albüm kapağı görsel URL'i |

**Tasarım kararları:**

- `fingerprint_data` LONGTEXT olarak saklanmaktadır; bu sayede
  recognizer servisinin restart edilmesi durumunda parmak izleri
  veri tabanından yeniden yüklenebilmekte ve **soğuk başlatma
  süresi kısaltılmaktadır**.
- `fingerprint_code` UNIQUE constraint ile korunmaktadır; recognizer
  tarafında dış anahtar (bellek içi sözlük) olarak kullanılmaktadır.
- `fingerprint.version` adlı uygulama düzeyi ayar (`app_setting`
  tablosu), parmak izi algoritmasının sürümünü takip eder. Bu sürüm
  değiştiğinde tüm `fingerprint_data` değerleri silinerek yeniden
  hesaplanmakta; böylece sürümler arası tutarsızlık otomatik
  giderilmektedir.

## 4.3. REST API Tasarımı

### 4.3.1. Genel Sözleşme

Atify REST API'si aşağıdaki ortak prensiplere göre tasarlanmıştır:

- **JSON gövdeli istek/yanıt** (multipart yalnızca dosya yükleme için).
- **JWT kimlik doğrulama**: Korunmuş uç noktalarda `Authorization:
  Bearer <token>` üst bilgisi gerekir.
- **HTTP durum kodları**: 200/201 başarı, 400 doğrulama hatası,
  401 yetkisiz, 403 erişim yasağı, 404 bulunamadı, 422 işlenebilir
  ancak iş kuralı reddi, 500 sunucu hatası.
- **`@ControllerAdvice` üzerinden merkezî hata yönetimi**: Tüm
  istisnalar `GlobalExceptionHandler` tarafından tek bir tutarlı
  formata dönüştürülür.

### 4.3.2. Birincil Uç Noktalar

**Çizelge 4.2.** Atify backend'in birincil REST uç noktaları
(seçili).

| Yöntem | Yol | Açıklama | Kimlik |
|---|---|---|---|
| POST | `/api/auth/register` | Kullanıcı kaydı | Açık |
| POST | `/api/auth/login` | Oturum açma + JWT | Açık |
| POST | `/api/auth/refresh` | JWT yenileme | Refresh token |
| GET | `/api/songs` | Şarkı listesi (paginate) | Açık |
| GET | `/api/songs/{id}` | Şarkı detayı | Açık |
| POST | `/api/songs/upload` | Şarkı yükleme + fingerprint | Admin |
| POST | `/api/songs/recognize` | Mikrofon kaydı ile şarkı tanıma | Açık |
| GET | `/api/favorites` | Kullanıcı favorileri | Auth |
| POST | `/api/favorites/{songId}` | Favori ekleme | Auth |
| GET | `/api/listening-history` | Dinleme geçmişi | Auth |
| POST | `/api/playlists` | Çalma listesi oluşturma | Auth |
| GET | `/api/admin/fingerprint/status` | Katalog senkron durumu | Admin |
| POST | `/api/admin/fingerprint/reindex` | Tam yeniden indeksleme | Admin |
| GET | `/actuator/health` | Sağlık kontrolü | Açık |

### 4.3.3. Recognizer İç Uç Noktaları

Python recognizer servisi backend tarafından özel olarak çağrılan
uç noktalar sunmaktadır:

**Çizelge 4.3.** Recognizer servisi uç noktaları (iç ağ).

| Yöntem | Yol | Açıklama |
|---|---|---|
| GET | `/health` | `{"status":"ok","fpVersion":2}` |
| GET | `/catalog-status` | Katalog boyutu ve sürüm |
| POST | `/fingerprint-file` | Multipart ses → parmak izi vektörü |
| POST | `/register-fingerprint` | Önceden hesaplanmış vektörü kataloga ekleme |
| POST | `/unregister-fingerprint` | Belirli songCode'u silme |
| POST | `/reset-catalog` | Katalogu tamamen boşaltma |
| POST | `/recognize-simple` | Sorgu → en olası eşleşme |

Recognizer servisi internete açık değildir; yalnızca Docker iç
ağındaki backend tarafından erişilebilir.

## 4.4. Kimlik Doğrulama ve Yetkilendirme

### 4.4.1. JWT Tabanlı Mimari

Atify, Spring Security üzerinde yapılandırılmış JWT tabanlı bir
kimlik doğrulama akışı kullanmaktadır. Akış aşağıdaki adımlardan
oluşur:

1. Kullanıcı `/api/auth/login` ile e-posta ve şifre gönderir.
2. Backend, BCrypt ile şifreyi doğrular ve iki jeton üretir:
   - **Access token (JWT, 24 saat geçerli):** Korunmuş uç noktalara
     erişim için.
   - **Refresh token (30 gün geçerli, veri tabanında saklı):** Süresi
     dolmuş access token'ın yenilenmesi için.
3. Sonraki isteklerde `JwtFilter` adlı `OncePerRequestFilter`,
   `Authorization` üst bilgisini ayrıştırır, doğrular ve
   `SecurityContext`'e yazar.
4. Access token süresi dolduğunda istemci `/api/auth/refresh`
   uç noktasına refresh token'ı göndererek yeni bir access token alır.

### 4.4.2. Rol Tabanlı Erişim

Sistemde iki temel rol mevcuttur:

- **`ROLE_USER`**: Standart kullanıcı; şarkı dinleme, favori,
  çalma listesi, dinleme geçmişi, şarkı tanıma.
- **`ROLE_ADMIN`**: Yönetici; şarkı yükleme, katalog yönetimi,
  kullanıcı rol değişikliği, denetim günlüğü görüntüleme.

`SecurityConfig` sınıfı, her uç noktanın hangi role/güvenlik
seviyesine ihtiyaç duyduğunu HTTP yapılandırması üzerinden
tanımlamaktadır. Ayrıca rol değişikliği gibi kritik işlemler için
ön yüzde **animasyonlu onay diyaloğu** uygulanmıştır; bu kontrol,
yanlış tıklama (mis-click) hatalarını önlemeye yöneliktir.

## 4.5. Şarkı Tanıma Akışı

Atify'da kullanıcının "Şarkı Tanı" düğmesine basmasından sonuç
almasına kadar geçen uçtan uca akış aşağıdaki adımlardan oluşur:

1. **Tarayıcı** mikrofona erişim izni ister; izin alındıktan sonra
   `MediaRecorder` ile 12 saniyelik kayıt başlatılır.
   - Tarayıcı seviyesinde DSP özellikleri (echo cancellation,
     noise suppression, AGC) **kapatılır**.
   - Codec: Opus, 128 kbps, mono.
2. Kayıt tamamlandığında WebM/Opus blob'u
   `POST /api/songs/recognize` uç noktasına multipart formatında
   yüklenir.
3. Backend `RecognizeService` aşağıdaki adımları yürütür:
   a. Geçici dosyaya yazma.
   b. ffmpeg ile WebM → WAV dönüşümü:
      `ffmpeg -i in.webm -ac 1 -ar 11025 -af "highpass=f=80,
      lowpass=f=5200,dynaudnorm=f=250:g=15" -c:a pcm_s16le out.wav`.
   c. Recognizer servisinin `/recognize-simple` uç noktasına WAV
      gönderimi.
4. Recognizer:
   a. WAV → NumPy dizisi.
   b. Parmak izi hesaplama (Bölüm 5'te ayrıntılı).
   c. Bellek içi katalog ile karşılaştırma.
   d. JSON yanıtı (`match`, `songCode`, `offsetMatches`,
      `sharedHashes`, `offsetRatio`, `hashCount`).
5. Backend, `songCode` üzerinden veri tabanından şarkı bilgilerini
   çekip ön yüze gönderir.
6. Ön yüz, eşleşen şarkı bilgilerini ve "Çal" düğmesini gösterir.

> *(Şekil 4.3 — Şarkı tanıma akış şeması; tez son derlemesinde
> sequence diyagramı olarak çizilecektir.)*

## 4.6. Katalog Senkronizasyonu

### 4.6.1. Bellek İçi Katalog ve Veri Tabanı Eşgüdümü

Recognizer'ın bellek içi `CATALOG` sözlüğü ile veri tabanındaki
`song.fingerprint_data` arasındaki tutarlılık üç mekanizmayla
sağlanmaktadır:

1. **Açılış senkronizasyonu (`FingerprintBackfillService`):**
   Backend ayağa kalktığında `ApplicationReadyEvent` üzerinden
   bir defalık eksik parmak izi hesaplaması ve recognizer'a
   register etme işlemi tetiklenir.
2. **Periyodik senkronizasyon (`FingerprintSchedulerService`):**
   Belirli aralıklarla recognizer ile veri tabanı arasındaki katalog
   farkı kontrol edilir; fark tespit edilirse eksik parçalar
   register edilir.
3. **Sürüm tabanlı tetikleyici (`FingerprintCatalogService`):**
   `fingerprint.version` ayarının değiştiği tespit edildiğinde
   tüm parmak izleri silinip yeniden hesaplanır; bu mekanizma
   algoritma yükseltmelerinin tek bir deploy ile dağıtılmasına
   olanak tanır.

### 4.6.2. Eşzamanlılık Garantileri

- **Recognizer tarafı:** Bellek içi sözlüğe yazma/okuma
  `threading.RLock` ile korunur. Sorgu sırasında yapılan iterasyon
  sözlük boyutunu sabit tutmak için **anlık kopya (snapshot)**
  üzerinden çalışır (Bölüm 6.4'te ayrıntılı).
- **Backend tarafı:** `AtomicBoolean syncInProgress` ile aynı
  anda yalnızca tek bir senkronizasyon işleminin yürütülmesi
  garanti edilir.

## 4.7. Dağıtım Topolojisi

### 4.7.1. Konteyner Ağı

Üretim sunucusunda dört konteyner aynı `bridge` türündeki Docker
ağında çalışmakta, iç hostname'ler ile birbirlerine erişmektedir
(`mysql`, `recognizer`, `backend`, `caddy`). Yalnızca Caddy
80/443 portlarını dış dünyaya açar; diğer konteynerler içe
kapalıdır.

### 4.7.2. Çalışma Zamanı Yapılandırması

Tüm uygulama düzeyi yapılandırma değişkenleri `.env.prod` dosyasında
toplanmıştır. Bu dosya:

- Git deposuna **commit edilmez** (`.gitignore`'da listelenir).
- `sync-prod.ps1` betiği tarafından SCP ile güvenli kanal üzerinden
  sunucuya kopyalanır.
- Veri tabanı şifresi, JWT imzalama anahtarı, Jamendo API anahtarı
  gibi gizli bilgileri içerir.

### 4.7.3. Sürekli Erişim Garantisi

Üretim sunucusu işletim sistemi servisi olarak `docker compose`
yığınını boot anında otomatik başlatır. Caddy'nin yaşam döngüsü TLS
sertifikalarının yenilenmesinden sorumludur ve günde bir kez ACME
istemcisi kontrol gerçekleştirir. MySQL ve recognizer servisleri
`unless-stopped` yeniden başlatma politikasıyla yapılandırılmıştır.
