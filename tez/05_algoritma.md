# 5. AKUSTİK PARMAK İZİ ALGORİTMASI

Bu bölümde, Atify recognizer servisinde kullanılan akustik parmak
izi algoritmasının matematiksel formülasyonu, parametrik seçimleri
ve eşleştirme stratejisi ayrıntılı olarak ele alınmıştır. Algoritma,
Wang'ın [@wang2003] orijinal landmark hashing yaklaşımını temel
almakta; canlı mikrofon kayıtlarındaki dayanıklılığı artıran ek
adımlar ile genişletilmiştir.

## 5.1. Algoritmanın Genel Bakışı

Atify'da kullanılan parmak izi süreci, bir ses sinyali $x(t)$ üzerinden
aşağıdaki dönüşüm zincirini izler:

$$
x(t)\;\longrightarrow\;\tilde{x}(n)\;\longrightarrow\;X(n,k)
\;\longrightarrow\;\mathcal{P}\;\longrightarrow\;\mathcal{H}
$$

Burada:
- $\tilde{x}(n)$: ön işlemden geçmiş, yeniden örneklenmiş ayrık zaman sinyali
- $X(n,k)$: kısa-süreli Fourier dönüşümü (STFT) sonucu
- $\mathcal{P}$: spektral tepe (peak) noktaları kümesi
- $\mathcal{H}$: hash kümesi (anchor-target çiftleri)

Eşleşme aşaması, sorgu hash kümesi $\mathcal{H}_q$ ile katalogtaki
herhangi bir şarkı hash kümesi $\mathcal{H}_s$ arasında ortak
hash'leri ve bu hash'lere ait zaman ofsetlerini analiz etmektedir.

## 5.2. Ön İşleme

### 5.2.1. Yeniden Örnekleme

Tarayıcıdan gelen ham ses tipik olarak 44.1 kHz veya 48 kHz örnekleme
hızındadır. Atify sistemi tüm girdileri **11.025 Hz mono** formata
indirgemektedir:

```python
TARGET_SAMPLE_RATE = 11025
```

Bu seçimin gerekçesi:

- İnsan kulağının müzik için ayırt edici bilgi taşıdığı frekans
  bandının yaklaşık 5 kHz altında yoğunlaşması (Nyquist limiti
  uyarınca 11.025 Hz örnekleme oranı 5.5 kHz'e kadar olan
  bileşenleri korumaktadır).
- FFT hesaplama maliyetinin örnekleme oranıyla doğru orantılı
  olarak azalması.
- Bant genişliğinin azaltılmasının, mikrofon ve hoparlör
  hatlarındaki yüksek frekanslı gürültüyü doğal olarak filtrelemesi.

### 5.2.2. Dinamik Aralık Normalizasyonu (dynaudnorm)

Mikrofonla yapılan kayıtlarda ortam ses seviyesi sabit değildir.
Bu durum, sabit eşik değerine dayalı tepe seçimini bozmaktadır.
Atify, ffmpeg'in `dynaudnorm` filtresini hem indeksleme hem de
sorgu yolunda **simetrik** olarak uygulamaktadır:

```bash
ffmpeg -i input -ac 1 -ar 11025 \
  -af "highpass=f=80,lowpass=f=5200,dynaudnorm=f=250:g=15" \
  -c:a pcm_s16le output.wav
```

Filtre zinciri üç adımdan oluşmaktadır:

1. **80 Hz altı yüksek geçiş (highpass=80):** Şehir gürültüsü,
   klima sesi gibi düşük frekanslı bileşenlerin temizlenmesi.
2. **5.2 kHz üstü alçak geçiş (lowpass=5200):** Nyquist limitinin
   üstünde anti-aliasing.
3. **Dinamik normalizasyon (`f=250:g=15`):** 250 ms'lik pencerelerde
   ses seviyesinin uyarlanarak ortalanması; 15 dB kazanç sınırı.

**Simetri ilkesi:** Aynı filtre, hem kataloga eklenen şarkı için
hem de canlı sorgu için uygulandığında, mikrofon kaydının orijinal
şarkıyla aynı normalize uzayda karşılaştırılması mümkün olmaktadır.

## 5.3. Kısa-Süreli Fourier Dönüşümü (STFT)

### 5.3.1. Pencereleme

Sinyal, üst üste binmeyen sabit boyutlu çerçevelere bölünerek her
çerçevenin frekans bileşenleri hesaplanır.

**Çizelge 5.1.** STFT parametreleri.

| Parametre | Değer | Açıklama |
|---|---|---|
| `WINDOW_SIZE` | 2048 örnek | ≈ 186 ms (11.025 Hz'de) |
| `HOP_SIZE` | 512 örnek | ≈ 46 ms — pencere kayması |
| `FRAME_STRIDE` | 1 | Her çerçevenin işlenmesi |
| Pencere fonksiyonu | Hann | Spektral sızmayı azaltır |

Çerçeve $n$ için STFT:

$$
X(n,k) \;=\; \sum_{m=0}^{N-1} w(m)\,\tilde{x}(nH+m)\,
e^{-j 2\pi km/N}
$$

Burada $N=2048$, $H=512$ ve $w(m)$ Hann pencere fonksiyonudur.

### 5.3.2. Bant Bölmeli Tepe Seçimi

STFT magnitüdü $|X(n,k)|$ üzerinde tepe seçimi yapılırken, frekans
ekseni psikoakustik olarak anlamlı sekiz banta bölünmektedir:

```python
BAND_EDGES_HZ = (60, 180, 320, 560, 1000, 1800, 3200, 5000)
```

Bu bölme yaklaşımı, müzikteki farklı enstrüman/seslerin
(bas, davul, vokal, hi-hat) farklı bantlarda yoğunlaşmasından
yararlanır. Her bantta bağımsız tepe seçimi yapılarak gürültü
nedeniyle baskın bir bandın diğerlerini bastırması engellenir.

Her çerçevede her bant için:

1. Bant içindeki spektral değerlerin enerji yüzdelik eşiği hesaplanır:
   $E_b = \mathrm{percentile}(|X(n,k)|^2, 20)$
   (`ENERGY_FLOOR_PERCENTILE = 20.0`)
2. Bu eşiğin üzerindeki en büyük spektral değer, bant tepe noktası
   $(n, k_b)$ olarak seçilir.

### 5.3.3. Tepeler Kümesi

Sonuç olarak her çerçeveden en fazla $|B|=8$ adet tepe noktası elde
edilir. Tüm sinyal için tepeler kümesi:

$$
\mathcal{P} = \bigcup_n \bigcup_b \{(n, k_{n,b})\}
$$

## 5.4. Landmark Hash Üretimi

### 5.4.1. Anchor-Target Eşleştirmesi

Wang algoritmasının temel buluşu, tek tek tepeleri değil, *çiftleri*
hashlemesidir. Bu sayede frekans-zaman düzleminde yerel desen
korunmuş olur. Atify uygulamasında her anchor noktası, gelecek
60 çerçeve içindeki en fazla 6 tepe noktasıyla eşleştirilmektedir:

```python
FUTURE_WINDOW = 60   # ≈ 2.78 saniye
FAN_OUT = 6
```

Her $(n_a, f_a) \in \mathcal{P}$ anchor için, $\Delta t \in (0,
\text{FUTURE\_WINDOW}]$ ve $(n_a + \Delta t, f_t) \in \mathcal{P}$
koşulunu sağlayan en fazla `FAN_OUT` adet hedef seçilir.

### 5.4.2. Hash Fonksiyonu

Her anchor-target çifti için hash:

$$
h \;=\; \texttt{format}(f_a, f_t, \Delta t)
\;=\; \texttt{"\{f}_a\texttt{\}:\{f}_t\texttt{\}:\{}\Delta t \texttt{\}"}
$$

Hash dize formatında saklanır ve karşılık olarak anchor zamanı
$n_a$ ile birlikte:

$$
\mathcal{H} = \{(h, n_a)\}
$$

### 5.4.3. Sürüm Numaralandırması

Atify'da algoritma `FP_VERSION = 2` ile etiketlenmektedir. Sürüm
1.x'ten 2.x'e geçişte yapılan başlıca değişiklikler:

**Çizelge 5.2.** Sürüm 1 ile sürüm 2 arasındaki başlıca farklar.

| Parametre | v1 | v2 | Etki |
|---|---|---|---|
| `FRAME_STRIDE` | 2 | 1 | Daha yoğun anchor |
| `FUTURE_WINDOW` | 20 | 60 | Daha geniş zaman bağı |
| `FAN_OUT` | 4 | 6 | Daha fazla landmark |
| `ENERGY_FLOOR_PERCENTILE` | 40 | 20 | Daha çok tepe |
| `MIN_HASH_COUNT` | 24 | 16 | Daha kısa kayıtlar kabul |
| `MIN_SHARED_HASHES` | 10 | 6 | Daha hoşgörülü |
| `MIN_OFFSET_MATCHES` | 6 | 5 | Daha hoşgörülü |
| `MIN_OFFSET_RATIO` | 0.03 | 0.02 | Daha hoşgörülü |
| `SECOND_BEST_MARGIN` | yok | 1.4 | Belirsizlik reddi |
| Hash çözünürlüğü | freq//2 | tam | Daha ayırt edici |

## 5.5. Eşleştirme ve Skorlama

### 5.5.1. Hash Kesişimi

Sorgu hash kümesi $\mathcal{H}_q$ ile aday şarkı hash kümesi
$\mathcal{H}_s$ kesişiminde, ortak hash'lerin sorgu ve katalog
zaman damgaları arasındaki fark hesaplanır:

$$
\Delta(h) = n_s - n_q
$$

Bu değer, sorgunun şarkının hangi anına denk geldiğini belirten
zaman ofsetidir.

### 5.5.2. Ofset Histogramı

Doğru bir eşleşme, $\Delta$ değerlerinde **belirgin bir tepe**
oluşturmalıdır. Çünkü sorgu örneği şarkının belirli bir parçasından
alınmıştır; dolayısıyla tüm ortak hash'ler benzer bir ofsetle
hizalanmalıdır.

Histogram inşası:

$$
H(\delta) = |\{h \in \mathcal{H}_q \cap \mathcal{H}_s :
\Delta(h) = \delta\}|
$$

Skor:

$$
\mathrm{score}(s) = \max_\delta H(\delta)
$$

### 5.5.3. Karar Eşikleri

Bir adayın geçerli sayılması için aşağıdaki tüm koşulların
sağlanması gerekir:

```python
MIN_HASH_COUNT       = 16   # sorgunun minimum hash sayısı
MIN_SHARED_HASHES    = 6    # |H_q ∩ H_s| ≥ 6
MIN_OFFSET_MATCHES   = 5    # max H(δ) ≥ 5
MIN_OFFSET_RATIO     = 0.02 # max H(δ) / |H_s| ≥ 0.02
```

### 5.5.4. İkinci-En-İyi Marj

Wang'ın orijinal algoritması en yüksek skoru tek başına yeterli
sayar. Atify, **belirsizlik reddi** için ek bir kontrol
uygulamaktadır:

$$
\mathrm{score}(s_1) \geq \texttt{SECOND\_BEST\_MARGIN}
\cdot \mathrm{score}(s_2)
$$

`SECOND_BEST_MARGIN = 1.4` kuralı, en iyi adayın ikinci en iyiden
en az %40 üstün olmasını gerektirir. Bu kural, kullanıcının
katalogda bulunmayan bir şarkıyı çalarken yanlış bir eşleşme
döndürülmesi (false positive) olasılığını ciddi ölçüde
azaltmaktadır.

### 5.5.5. Yanıt Formatı

Recognizer servisi, başarılı bir eşleşme için aşağıdaki JSON
yanıtını döndürmektedir:

```json
{
  "match": true,
  "songCode": "song_42",
  "offsetMatches": 18,
  "sharedHashes": 32,
  "offsetRatio": 0.041,
  "hashCount": 274
}
```

- `offsetMatches`: $\max_\delta H(\delta)$
- `sharedHashes`: $|\mathcal{H}_q \cap \mathcal{H}_s|$
- `offsetRatio`: `offsetMatches / |H_s|`
- `hashCount`: $|\mathcal{H}_q|$

Bu metrikler, hata ayıklama ve doğruluk analizi için Bölüm 6'da
kapsamlı şekilde değerlendirilmiştir.

## 5.6. Sıkıştırma ve Saklama

Parmak izi vektörleri veri tabanında ham metin olarak değil,
sıkıştırılmış formatta saklanmaktadır:

1. Hash listesi JSON formatına serileştirilir.
2. zlib ile sıkıştırılır (varsayılan seviye 6).
3. Base64 ile metne kodlanır.
4. `song.fingerprint_data` (LONGTEXT) sütununa yazılır.

Tipik bir 3-4 dakikalık şarkı için sıkıştırılmış parmak izi
boyutu **800-1500 KB** civarındadır; ham JSON formatına göre
yaklaşık **%40-50** bir sıkıştırma oranı elde edilmektedir.

Soğuk başlatma sırasında recognizer, veri tabanından bu vektörü
okuyup **decode_fingerprint** fonksiyonu ile bellek içi katalogu
yeniden inşa eder; böylece her açılışta yeniden hesaplama
yapmaktan kaçınılır.

## 5.7. Algoritma Karmaşıklığı

### 5.7.1. Zaman Karmaşıklığı

- **Parmak izi üretimi:** $O(L \log N)$, burada $L$ ses süresi
  saniye cinsinden, $N$ pencere boyutu. 11.025 Hz'de 4 dakikalık
  bir şarkı için ≈ 130 KB hash ile saniyeler mertebesinde.
- **Eşleştirme:** $O(|\mathcal{H}_q| + \sum_s |\mathcal{H}_q \cap
  \mathcal{H}_s|)$. Bellek içi sözlük araması $O(1)$, dolayısıyla
  her sorgu için katalog boyutuyla doğrusal değil, ortak hash
  sayısıyla doğrusal artar.

### 5.7.2. Bellek Karmaşıklığı

Bellek içi `CATALOG` sözlüğü boyut olarak yaklaşık:

$$
M_{\mathrm{catalog}} \approx \sum_{s \in \mathrm{songs}}
|\mathcal{H}_s| \cdot 16 \;\text{byte}
$$

Atify'ın 70 şarkılı kataloğunda bu değer yaklaşık **120-180 MB**
civarındadır. 1.000 şarkılık bir katalog için tahminî ihtiyaç
1.7-2.5 GB olup, mevcut 4 GB RAM'lik VPS yapılandırmasında
çalıştırılabilir niteliktedir.

## 5.8. Algoritmanın Sınırları

Wang tarzı landmark hashing, aşağıdaki durumlarda performansı
düşürmektedir:

- **Tempo değişimi (pitch shift / time stretch):** Hash zaman
  farkı $\Delta t$ doğrudan etkilenir; %5'in üzerindeki tempo
  değişimleri ciddi tanıma kaybına yol açar.
- **Cover/remix versiyonları:** Aynı melodinin farklı
  düzenlemeleri tepelerin frekans/zaman konumlarını değiştirir.
  Bu durum için Chromaprint [@lalinsky2010] daha uygundur.
- **Çok kısa örnekler (< 5 saniye):** $|\mathcal{H}_q|$ değeri
  `MIN_HASH_COUNT` eşiğinin altına düşebilir.
- **Yüksek arka plan müziği:** Birden fazla müzik kaynağı
  bulunduğunda hash karışıklığı oluşur.

Bu sınırlamalar, Bölüm 7'de gelecek çalışmalar başlığı altında
ele alınacak öneriler için temel oluşturmaktadır.
