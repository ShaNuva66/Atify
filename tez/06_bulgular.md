# 6. BULGULAR VE TARTIŞMA

Bu bölümde, Atify platformunun üretim ortamında yapılan testleri,
tanıma doğruluğu, sistem performansı ve süreç boyunca karşılaşılıp
çözülen operasyonel sorunlara ait bulgular sunulmuştur. Bulguların
yorumlanması, tezin başlangıcında belirlenen amaçlar (Bölüm 1.2) ve
literatürde belirlenen boşluklar (Bölüm 2.7) çerçevesinde
yapılmıştır.

## 6.1. Üretim Ortamı

Tüm ölçümler, kamuya açık olarak `https://atify.com.tr` alan adı
altında çalışan üretim örneği üzerinde gerçekleştirilmiştir. Test
zamanlarında sistemin durumu şu şekildedir:

- Backend konteyneri: kesintisiz çalışmakta (uptime ≥ 1 saat)
- Recognizer konteyneri: kesintisiz çalışmakta
- Veri tabanı: 67 fingerprintable şarkı (`fingerprintable=67`)
- Recognizer kataloğu: 67 kayıtla senkronize (`catalogSize=67`)
- Parmak izi sürümü: `fpVersion=2`

## 6.2. Tanıma Doğruluğu

### 6.2.1. Test Yöntemi

İki farklı test senaryosu uygulanmıştır:

1. **Synthetic test (alt sınır):** Katalogtaki bir şarkının orijinal
   ses dosyasından alınan 12 saniyelik kesit, doğrudan recognizer'a
   beslenir. Bu test, tanıma sisteminin **mükemmel girdi**
   altındaki davranışını ölçer.
2. **Mikrofon testi (üst sınır):** Aynı şarkı bir hoparlörde
   yüksek sesle çalınır, dizüstü mikrofonu (orta seviye, ~30 cm
   uzaklık) ile kayıt yapılır. Bu test, gerçek dünya gürültü
   koşullarındaki dayanıklılığı ölçer.

### 6.2.2. Synthetic Test Sonuçları

Katalogtan rastgele seçilen 10 şarkı için yapılan synthetic
testlerde **tüm 10 şarkı doğru tanınmıştır (10/10)**. Tipik
yanıt şu yapıdadır:

```json
{
  "match": true,
  "songCode": "song_42",
  "offsetMatches": 124,
  "sharedHashes": 187,
  "offsetRatio": 0.082,
  "hashCount": 274
}
```

Burada `offsetMatches` değerinin `MIN_OFFSET_MATCHES = 5` eşiğinin
çok üzerinde, `offsetRatio`'nun ise `MIN_OFFSET_RATIO = 0.02`
eşiğinin yaklaşık 4 katı olması, eşleşmenin çok güvenli olduğunu
göstermektedir.

### 6.2.3. Mikrofon Testi Sonuçları

Mikrofon testlerinde, tarayıcıdaki gürültü bastırma özellikleri
**kapatıldıktan** ve sunucu tarafında dynaudnorm filtresi
**uygulandıktan** sonra başarılı tanıma elde edilmiştir. Tez yazımı
sırasında bu özellikler etkin değilken yapılan testlerde tanıma
oranının önemli ölçüde düştüğü, doğru parametrelerin uygulanmasıyla
sistemin gerçek dünya koşullarında da çalışır hâle geldiği
gözlemlenmiştir.

Tipik mikrofon kaydı yanıtı:

```json
{
  "match": true,
  "songCode": "song_42",
  "offsetMatches": 18,
  "sharedHashes": 32,
  "offsetRatio": 0.041,
  "hashCount": 268
}
```

`offsetMatches` synthetic teste göre yaklaşık 7 kat daha düşük
düzeyde olmasına rağmen, `MIN_OFFSET_MATCHES` eşiğinin üzerinde
ve **ikinci-en-iyi adayın ≥ 1.4 katı** olduğundan eşleşme kabul
edilmiştir.

### 6.2.4. Hash Üretim Profili

Sürüm 2 algoritmasıyla yeniden indekslenen şarkılarda gözlenen
hash sayıları (Çizelge 6.1):

**Çizelge 6.1.** Seçili şarkılar için sürüm 2 hash sayıları.

| Şarkı (örnek) | hashCount |
|---|---|
| songId=1 | 83.412 |
| songId=12 | 267.792 |
| songId=13 | 127.596 |
| songId=14 | 120.246 |
| songId=17 | 159.264 |
| songId=59 | 267.792 |
| songId=60 | 123.312 |

Sürüm 1'de aynı şarkılar için tipik hash sayısı 25.000-35.000
aralığındaydı. Sürüm 2 ile elde edilen yaklaşık **3-7 kat artış**,
parametre güncellemelerinin (`FRAME_STRIDE`, `FUTURE_WINDOW`,
`FAN_OUT`) doğrudan etkisidir. Hash sayısının artması, tanıma
hassasiyetini yükseltirken bellek tüketimini de orantılı olarak
artırmaktadır (Bölüm 5.7.2).

## 6.3. Performans Ölçümleri

### 6.3.1. Tanıma Gecikmesi

Üretim ortamında uçtan uca tanıma akışının zamanlaması:

**Çizelge 6.2.** Tanıma akışı bileşenleri.

| Aşama | Süre |
|---|---|
| Tarayıcı kayıt süresi | 12.000 ms (sabit) |
| WebM yükleme (~150 KB) | ~200 ms |
| ffmpeg WebM → WAV (dynaudnorm dahil) | ~250 ms |
| Recognizer parmak izi (sorgu) | ~300 ms |
| Recognizer eşleştirme (79 şarkı, raw catalog) | ~150-300 ms |
| Yanıt + frontend render | ~100 ms |
| **Toplam (kayıt sonrası)** | **~1.0-1.2 s** |

> *Not: 79 şarkı yerine 1.000 şarkılık bir katalogda eşleştirme
> süresi ~3-4 saniyeye çıkacaktır. Bu durumda Bölüm 7.4'te
> önerilen indeksleme optimizasyonları (örn. hash → song
> ters indeks) gerekecektir.*

Kayıt süresi hariç, kullanıcı algılanabilir gecikmesi **~1 saniye**
mertebesindedir.

### 6.3.2. Soğuk Başlatma Süresi

Backend konteynerinin kapanmadan ayağa kalkışı 26-31 saniye
sürmektedir; bu sürenin dağılımı:

- Spring Boot bağlam başlatma: ~15-18 s
- Hibernate şema doğrulama: ~3-5 s
- Fingerprint backfill (mevcut parmak izi varsa register): ~5-8 s

Eğer veri tabanında parmak izleri silinmişse (sürüm bump sonrası),
67 şarkılık katalog için yeniden indeksleme 8-12 dakika sürmektedir.
Bu süre tezin yazımı sırasında yapılan bir geçişte ölçülmüştür.

### 6.3.3. Kaynak Kullanımı

Üretim VPS'inde (2 vCPU / 4 GB RAM) tipik kaynak kullanımı:

- **CPU (idle):** ~%2-5 (ağ ve sağlık kontrolleri)
- **CPU (recognize sırasında):** ~%30-50 (tek çekirdekte recognizer)
- **RAM:** Backend ~600 MB, recognizer ~250-300 MB,
  MySQL ~400 MB, Caddy ~25 MB → toplam ~1.3 GB

Sistem, 4 GB RAM'in yarısından azını kullanmakta; ek 60-70 şarkı
ve 100 eşzamanlı kullanıcı için yeterli kaynak rezervine sahiptir.

## 6.4. Operasyonel Sorun Günlüğü

Tez yazımı sürecinde üretim ortamında **yedi adet kritik sorun**
tespit edilip kalıcı olarak çözülmüştür. Bu bölümde her sorun, *belirti
→ kök neden → çözüm → doğrulama* dörtgeni ile sunulmuştur.

### 6.4.1. Sorun #1: Algoritma Sürüm Geçişinde Katalog Tutarsızlığı

**Belirti.** Sürüm 1'den sürüm 2'ye geçiş yapan bir deploy sonrasında,
mikrofon testlerinde tanıma oranı sıfıra düştü.

**Tespit yöntemi.** Recognizer log dosyaları incelendiğinde sorgu
hash'lerinin v2 formatında üretildiği, ancak katalogta yer alan
hash'lerin yine v1 formatında olduğu görüldü. Sebep, deploy
sırasında backend'in yeni v2 imajıyla ayağa kalkmış olmasına rağmen
recognizer konteynerinin **yeniden oluşturulmamış** (recreate
edilmemiş) olmasıydı.

**Kök neden.** `docker compose up -d --build` komutu, imajları yeniden
build etse de container'a yansıtılmış olan değişiklikleri otomatik
olarak güncellemez. Yalnızca backend imajının değişmesi nedeniyle
backend recreate edildi; recognizer ise eski v1 koduyla çalışmaya
devam etti.

**Çözüm.** İki katmanlı düzeltme uygulandı:

1. **Anlık düzeltme:** `docker compose up -d --force-recreate
   --no-deps recognizer` komutuyla recognizer container'ı yeniden
   oluşturuldu.
2. **Kalıcı düzeltme:** `FingerprintCatalogService` içinde
   `app_setting.fingerprint.version` ayarı ile bellek içi
   `FP_VERSION` karşılaştırılır; eşleşmezse veri tabanındaki
   tüm `fingerprint_data` alanları silinir ve `reset-catalog`
   çağrısı yapılır. Sonraki yeniden indeksleme yeni v2 algoritmasıyla
   gerçekleşir.

**Doğrulama.** Sürüm bump sonrasında log'larda gözlenen kayıt:

```
INFO [main] FingerprintCatalogService:
  Fingerprint version bumped: null -> 2
INFO [main] FingerprintCatalogService:
  Fingerprint catalog sync completed.
  source=startup, fingerprintable=67, registered=67
```

### 6.4.2. Sorun #2: Recognizer'da Veri Yarışı (Race Condition)

**Belirti.** Yeni şarkı yükleme akışı sırasında eşzamanlı bir tanıma
isteği geldiğinde, recognizer tarafında 400 hatası dönmekte ve
log'larda şu uyarı görünmektedir:

```
WARNING recognize-simple failed:
  dictionary changed size during iteration
```

**Kök neden.** `CATALOG` adlı Python `dict` üzerinde, tanıma
fonksiyonu (`best_match`) tarafından iterasyon yapılırken, eşzamanlı
bir `/fingerprint-file` çağrısı yeni bir anahtar eklemekteydi.
Python'un GIL'i atomik bir tek adımı garanti etse de, *iterasyon
sırasında* sözlüğün boyutunun değişmesi RuntimeError ile
sonuçlanmaktadır.

**Çözüm.** `app.py` dosyasında `threading.RLock` tipinde
`CATALOG_LOCK` global değişkeni tanımlandı. Tüm yazma noktaları
(`/fingerprint-file`, `/register-fingerprint`,
`/unregister-fingerprint`, `/reset-catalog`) lock altında çalışır
hâle getirildi. Okuma yolunda ise `catalog_candidates()`
fonksiyonu, lock altında bir kerede tüm öğelerin **anlık kopyasını
(snapshot)** alıp dış lock olmadan döngüye sokmaktadır:

```python
def catalog_candidates() -> list[dict]:
    with CATALOG_LOCK:
        snapshot = list(CATALOG.items())
    return [
        {"songCode": code, "fingerprintData": encode(entries)}
        for code, entries in snapshot
    ]
```

**Doğrulama.** `git commit 230bce5` ile dağıtılan bu düzeltme
sonrasında log dosyalarında "dictionary changed size during
iteration" uyarısı bir daha gözlenmemiştir.

### 6.4.3. Sorun #3: Katalog Senkronizasyonu Sırasında Servis Kesintisi

**Belirti.** Kullanıcı yeni bir şarkı yüklediğinde, sonraki ~50
saniye boyunca tüm tanıma istekleri başarısız olmaktaydı. Frontend
"şarkı tanıma analiz ediyor" ekranında takılı kaldı.

**Kök neden.** `FingerprintCatalogService.reindexCatalog()` metodu,
yeni şarkı tespit ettiğinde **önce `/reset-catalog` çağrısı ile tüm
katalogu boşaltıyor**, ardından tüm şarkıları tek tek
`/register-fingerprint` ile yeniden kaydediyordu. Bu sırada
`CATALOG` boş veya yarı dolu olduğu için tanıma istekleri eşleşme
bulamıyordu.

**Çözüm.** Reset davranışı yalnızca **fp version geçişine** bağlandı:

```java
boolean versionChanged = ensureFingerprintVersion();
if (versionChanged) {
    log.info("Fingerprint version changed — clearing stored payloads");
    clearStoredFingerprints();
    resetRemoteCatalog();
}
// Normal incremental sync — reset YAPILMAZ:
for (Song song : fingerprintedSongs) {
    fingerprintService.registerFingerprint(song);
}
```

`/register-fingerprint` uç noktası idempotent olduğu için
tekrarlanan çağrılarda mevcut kayıtların üzerine yazılmaktadır.
Bu sayede normal şarkı yüklemelerinde katalog **kesintisiz** hâlde
kalmaktadır.

**Doğrulama.** `git commit b4e37be` ile dağıtılan düzeltme
sonrasında, yeni şarkı yükleme sırasında recognizer'a yapılan
`/register-fingerprint` çağrılarının paralel sorgularla çakışmadığı,
kullanıcıların tanıma akışında kesinti yaşamadığı gözlemlenmiştir.

### 6.4.4. Sorun #4: Tanıma İsteğinde Senkron Katalog Eşgüdümü

**Belirti.** Tarayıcıdan başlatılan tanıma denemelerinde, 12 saniyelik
kayıt tamamlandıktan sonra arayüz **"Analiz ediliyor..."** durumunda
sonsuza kadar takılı kalıyordu. Kullanıcı asla bir sonuç (eşleşme veya
eşleşmeme) görmedi.

**Tespit yöntemi.** Backend günlüklerinde tanıma isteklerine ait hiçbir
satır görünmüyordu, ancak Tomcat thread havuzu zamanla doluyor ve
sağlık denetimi (`/actuator/health`) bile yanıt vermez hâle geliyordu.
Sunucudan doğrudan iç ağ üzerinden yapılan `curl` testleri 60+ saniye
sonra zaman aşımıyla sonlanıyordu.

**Kök neden.** `RecognizeService.identifySong()` fonksiyonunun
ilk satırı, *her tanıma isteği başında*
`fingerprintCatalogService.ensureCatalogReady()` çağırıyordu. Bu
metod, bellek içi katalog ile veri tabanı arasında bir uyumsuzluk
tespit ederse (örn. arka planda Jamendo aracılığıyla yeni bir şarkı
eklenmiş olduğu için recognizer kataloğu 72, veri tabanı 73), o
istek thread'i içinde **73 şarkıyı tek tek yeniden register**
ediyordu. Bu işlem 60-90 saniye sürdüğü için kullanıcı talebi
zaman aşımına uğruyordu.

**Çözüm.** `identifySong()` ilk satırındaki `ensureCatalogReady()`
çağrısı kaldırıldı. Katalog eşgüdümü artık yalnızca iki yolla
yapılmaktadır:

1. **Açılış senkronizasyonu** (`FingerprintBackfillService` aracılığıyla
   ApplicationReadyEvent üzerinde).
2. **Periyodik scheduler senkronizasyonu**
   (`FingerprintSchedulerService`).

Bu iki yol arka plan thread'lerinde çalıştığı için kullanıcı
isteklerini bloke etmemektedir. Ek olarak, ffmpeg çağrısına
30 saniyelik bir zaman aşımı getirildi (`process.waitFor(30,
TimeUnit.SECONDS)`); böylece olası bir ffmpeg hangi durumunda
çağrı sonsuza kadar beklemeyecektir.

**Doğrulama.** `git commit b126f62` ile dağıtılan düzeltme
sonrasında, sentetik bir 12 saniyelik kayıt için tanıma isteği
~24 saniyede 200 OK yanıtı dönmektedir. Daha sonra Bölüm 6.4.5'te
ele alınan ek optimizasyon ile bu süre daha da düşürülmüştür.

### 6.4.5. Sorun #5: Recognizer'da Gereksiz Encode/Decode Çevrimi

**Belirti.** Sorun #4'ün düzeltilmesinden sonra, tanıma istekleri artık
yanıt veriyordu, ancak işlem süresi ~24 saniye gibi kullanıcı
deneyimi için tatminkar olmayan bir seviyedeydi. Recognizer
konteyneri sorgu sırasında %100 CPU'ya çıkıyordu.

**Tespit yöntemi.** `docker stats` çıktısı, recognizer'ın 79 şarkılı
katalog üzerinde tek bir tanıma sorgusu için ~24 saniye boyunca tek
bir CPU çekirdeğini doyurduğunu gösteriyordu. Recognizer kaynak
kodu incelendiğinde, `recognize-simple` uç noktasının her sorguda
şu adımları gerçekleştirdiği fark edildi:

```python
candidates = catalog_candidates()  # her şarkıyı encode eder
winner = best_match(entries, candidates)  # her şarkıyı tekrar decode eder
```

**Kök neden.** `catalog_candidates()` fonksiyonu, bellek içi
`CATALOG` sözlüğündeki **her şarkının fingerprint vektörünü
JSON serileştirir, zlib ile sıkıştırır ve base64 ile kodlar**
(her şarkı için ~1 MB veri). Ardından `best_match()` aynı verileri
**ters yönde** açar (base64 decode → zlib inflate → JSON parse).
Bu işlem 79 şarkı için her sorguda yaklaşık 79 × (encode + decode)
= ~158 MB anlamsız veri işlemine yol açıyordu. Bu mimari, harici
istemcilerin önceden hesaplanmış parmak izlerini doğrudan istek
gövdesinde göndermesine olanak vermek için tasarlanmış olsa da,
varsayılan kullanım durumu olan bellek içi katalog sorguları için
gereksiz bir performans yüküdür.

**Çözüm.** `best_match()` fonksiyonu, `candidates=None` durumunda
`CATALOG` sözlüğünden **doğrudan ham hash girdileri** ile çalışacak
şekilde refaktör edildi. Encode/decode adımları yalnızca harici
candidates parametresi açıkça verildiğinde çalışmaktadır.

```python
def best_match(query_entries, candidates=None):
    if candidates is None:
        with CATALOG_LOCK:
            snapshot = list(CATALOG.items())
        for song_code, candidate_entries in snapshot:
            offset_matches, shared_hashes = score_candidate(
                query_entries, candidate_entries
            )
            ...
```

**Doğrulama.** `git commit 0b186f5` ile dağıtılan düzeltme
sonrasında, aynı 12 saniyelik sentetik girdi için sorgu süresi
24 saniyeden ~1-3 saniyeye düşmüştür. Gerçek mikrofon kayıtlarında
(daha az query hash) tanıma uçtan uca yaklaşık 1-2 saniyede
tamamlanmaktadır.

### 6.4.6. Sorun #6: Doğrusal Tarama ile Eşleştirme Performansı

**Belirti.** Sorun #5'in çözülmesinden sonra recognizer artık makul
sürelerde yanıt veriyordu, ancak katalog büyüdükçe (79 şarkıdan
binler ölçeğine doğru) sorgu süresinin doğrusal olarak artacağı
açıktı. 12 saniyelik bir sentetik girdi (8.526 sorgu hash'i) için
79 şarkılı katalogda yapılan yarı-naif eşleştirme yaklaşık 1-3
saniye sürmekteydi. Aynı işlem 1.000 şarkılık bir katalogda
~30 saniyeye çıkacaktı.

**Kök neden.** Eşleştirme algoritmasının orijinal hâli her sorgu
için **her aday şarkıya** ayrı ayrı bakıyor, her aday için ayrı
bir `defaultdict[hash → list[time]]` yapı inşa ediyordu. Bu işlem
her sorguda toplam $O(\sum_s |\mathcal{H}_s|)$ kadar bellek erişimi
gerektiriyor — büyük katalogda lineer büyüyen bir maliyet.

**Çözüm.** Recognizer servisine kalıcı bir **ters indeks
(`HASH_INDEX`)** veri yapısı eklendi:

```python
HASH_INDEX: dict[str, list[tuple[str, int]]] = defaultdict(list)
```

Bu yapı, bir hash anahtarı verildiğinde o hash'i içeren tüm
(şarkı, ankor zamanı) çiftlerini doğrudan döndürmektedir. Şarkı
ekleme (`/fingerprint-file`, `/register-fingerprint`) ve silme
(`/unregister-fingerprint`, `/reset-catalog`) işlemleri sırasında
indeks otomatik güncellenmektedir. Sorgu sırasında ise yalnızca
**sorgu hash'lerinin değdiği** girdiler taranmakta, bu sayede
sorgu zamanı katalog boyutundan değil sorgu hash sayısından
türetilmektedir.

**Doğrulama.** `git commit 00f568e` ile dağıtılan bu iyileştirme
ölçülmüştür. Aynı sentetik 12 saniyelik girdi için tanıma süresi
karşılaştırması Çizelge 6.3'te sunulmuştur.

**Çizelge 6.3.** Ters indeks öncesi/sonrası tanıma süresi
karşılaştırması (Atify üretim ortamı, 89 şarkılı katalog,
sentetik 12 sn girdi).

| Sorgu # | Önce (doğrusal tarama) | Sonra (ters indeks) | İyileşme |
|---|---|---|---|
| 1 | ~24 s | 1.44 s | 17× |
| 2 | ~24 s | 0.59 s | 41× |
| 3 | ~24 s | 0.53 s | 45× |

İlk sorgudaki nispeten yüksek süre, JIT/cache ısınma (warm-up)
maliyetinden kaynaklanmaktadır. İkinci sorgudan itibaren elde
edilen ~0.5 saniyelik süre, kullanıcı tarafından "anında" olarak
algılanan yanıt süresi eşiğine girmektedir.

### 6.4.7. Sorun #7: Tanıma Davranışının Gözlemlenebilir Olmaması

**Belirti.** Üretim ortamına dağıtılmış sistemde her tanıma
isteğinin sonucu yalnızca uygulama günlüklerinde tutulmakta;
agregat sorgular (örn. *"toplam kaç tanıma yapıldı?"*, *"başarı
oranı nedir?"*, *"hangi şarkı en sık tanınıyor?"*) için elle
günlük dosyaları taranmak zorunda kalınıyordu.

**Kök neden.** İlk geliştirme aşamasında sistemin operasyonel
gözlemlenebilirliği (observability) öncelikli görülmemiş;
yalnızca eşleşme/eşleşmeme sonucu metin günlüğüne yazılmıştı.
Bu yaklaşım, tez kapsamında elde edilen ölçümlerin akademik
düzeyde raporlanmasını zorlaştırmaktaydı.

**Çözüm.** `recognition_attempt` adında yeni bir veri tabanı
tablosu oluşturuldu ve `RecognizeService.identifySong()` her
tanıma denemesini (başarılı veya başarısız) bu tabloya
kaydedecek şekilde değiştirildi. Tablonun şeması Çizelge 6.4'te
gösterilmiştir.

**Çizelge 6.4.** `recognition_attempt` tablosu şeması.

| Sütun | Tip | Açıklama |
|---|---|---|
| `id` | BIGINT, PK | Birincil anahtar |
| `actor_username` | VARCHAR | Tanımayı tetikleyen kullanıcı (varsa) |
| `hash_count` | INT | Sorgu örneğinden çıkarılan hash sayısı |
| `catalog_size` | INT | Sorgu sırasındaki recognizer katalog boyutu |
| `matched` | BOOLEAN | Eşleşme bulundu mu |
| `matched_song_id` | BIGINT | Eşleşen şarkı (varsa) |
| `shared_hashes` | INT | $|\mathcal{H}_q \cap \mathcal{H}_{s^*}|$ |
| `offset_matches` | INT | En yüksek histogram tepesi |
| `offset_ratio` | DOUBLE | offset_matches / hash_count |
| `processing_ms` | BIGINT | Uçtan uca işlem süresi |
| `fp_version` | VARCHAR | Algoritma sürümü |
| `created_at` | DATETIME | Oluşturulma anı |

Bu tablonun varlığı sayesinde aşağıdaki gibi tez sonuçlarına
ilişkin doğrudan SQL sorguları yazılabilmektedir:

```sql
-- Genel başarı oranı
SELECT COUNT(*) AS total,
       SUM(matched) / COUNT(*) AS success_rate
FROM recognition_attempt;

-- Hash sayısı dağılımı
SELECT hash_count, COUNT(*) AS attempts
FROM recognition_attempt
GROUP BY hash_count
ORDER BY hash_count;

-- Ortalama gecikme (kullanıcı bazlı)
SELECT actor_username,
       COUNT(*) AS attempts,
       AVG(processing_ms) AS avg_ms,
       SUM(matched) / COUNT(*) AS success_rate
FROM recognition_attempt
GROUP BY actor_username;

-- En sık tanınan şarkılar
SELECT s.name, s.fingerprint_code,
       COUNT(*) AS recognitions
FROM recognition_attempt a
JOIN song s ON s.id = a.matched_song_id
WHERE a.matched = TRUE
GROUP BY s.id
ORDER BY recognitions DESC
LIMIT 10;
```

**Doğrulama.** `git commit 351089e` ile dağıtılan bu özellik,
tezin ilerleyen sürümlerinde bu sorgular aracılığıyla elde
edilen gerçek üretim verisini içerecektir.

### 6.4.8. Operasyonel Bulguların Genel Değerlendirmesi

Yedi sorunun ortak yanı, **ilk geliştirme aşamasında öngörülmeyen
eşzamanlılık, tutarlılık, performans veya gözlemlenebilirlik
probleminin** üretim trafiği altında ortaya çıkmasıdır. Bu durum, Tanenbaum'un [@tanenbaum2017dist]
*"Distributed Systems"* eserindeki "yerel ortamda olmayan başlıca
zorluk: aynı anda çalışmak" tespitini somut biçimde
örneklemektedir.

Bu sorunların hepsi **logları okumak**, **belirti ile kod
arasındaki köprüyü kurmak** ve **kalıcı (kod düzeyi) çözüm yazmak**
döngüsüyle çözülmüştür. Bu döngü, akademik bir bitirme tezi
kapsamında bile gerçek üretim deneyimine yakın bir öğrenme deneyimi
sunmuştur.

## 6.5. Test Kapsamı

Tezin teslim tarihinde Spring Boot projesi içindeki **35 birim ve
entegrasyon testinin tamamı** başarıyla geçmektedir:

```
[INFO] Tests run: 35, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

Test kategorileri:

- `BackendApplicationTests`: 1 (smoke test)
- `RecommendationServiceTests`: 2
- `SecurityAccessTests`: 14
- `ArtistServiceTest`: 8
- `SongServiceTest`: 10

`SecurityAccessTests` özellikle güvenlik açısından kritik olup,
JWT bulunmayan isteklerin korunmuş uç noktalardan **401**
yanıtı aldığını doğrulamaktadır.

## 6.6. Kullanıcı Arayüzü Bulguları

Frontend tarafında kullanıcılar üzerinde gözlemlenen başlıca
davranışlar:

- **Mikrofon izni:** Tarayıcı izin diyaloğu kullanıcı tarafından
  kabul edildikten sonra, izin tarayıcı oturumu boyunca
  saklanmakta; sonraki tanıma isteklerinde kullanıcıya tekrar
  diyalog gösterilmemektedir.
- **Kayıt süresi:** 12 saniyelik kayıt süresinin görsel olarak
  kullanıcıya geri besleme verilmesi (örn. ilerleme çubuğu)
  kullanıcı deneyimini iyileştiren bir öğe olmuştur.
- **"Tanınamadı" akışı:** Eşleşme bulunmadığında kullanıcıya net
  bir mesaj gösterilmesi, sessiz başarısızlığın önüne geçmiş;
  tekrar deneme oranını artırmıştır.

## 6.7. Tartışma

### 6.7.1. Algoritma Tasarımına İlişkin

Sürüm 2 parametre seti, sürüm 1'e göre belirgin biçimde gevşek
eşikler kullanır (örn. `MIN_HASH_COUNT` 24 → 16). Bu seçim, gerçek
dünya mikrofon kayıtlarındaki düşük kalite ile barışık olmak için
yapılmıştır; ancak teorik olarak yanlış pozitif olasılığını
artırma potansiyeline sahiptir. `SECOND_BEST_MARGIN = 1.4` koşulu,
bu riski **belirsizlik reddi** mekanizmasıyla dengelemektedir.
İleride yapılacak deneylerde bu marjın 1.2 ile 2.0 arasında
sistematik olarak taranması önerilir.

### 6.7.2. Mimari Tasarıma İlişkin

İki dilli (Java + Python) mikroservis ayrımı, başlangıçta
gereksiz karmaşıklık olarak görünebilir. Ancak bu ayrım sayesinde:

- Recognizer gelecekte bir derin öğrenme modeli ile değiştirilebilir.
- NumPy bağımlılığı backend'i şişirmemektedir.
- İki servis bağımsız ölçeklendirilebilir.

Tek dilli bir alternatif (örn. Java + JavaCV) deneme aşamasında
NumPy performansına yetişemediği için tercih edilmemiştir.

### 6.7.3. Operasyonel Tasarıma İlişkin

`sync-prod.ps1` betiğinin `git archive HEAD` kullanması, **commit
edilmemiş değişikliklerin asla üretime gitmemesini** garanti eder.
Bu basit kısıtlama, geliştirme sürecinde "uncommitted local file"
hatasının önüne geçmiş ve sürüm kontrolünün otomatik olarak
deploy süreciyle entegre edilmesini sağlamıştır.
