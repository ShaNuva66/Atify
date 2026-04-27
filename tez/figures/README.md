# Tez Figürleri

## Hazır PNG dosyaları (algoritma görselleri)

Bu görseller `generate_algorithm_figures.py` ile üretilir. Yeniden
üretmek için:

```bash
cd backend/tez/figures
pip install numpy matplotlib   # ilk kez
python generate_algorithm_figures.py
```

| Dosya | Açıklama |
|---|---|
| `sekil_5_1_stft.png` | STFT spektrogram örneği |
| `sekil_5_2_peaks.png` | Bant bölmeli tepe seçimi |
| `sekil_5_3_landmarks.png` | Anchor-target landmark eşleştirmesi |
| `sekil_5_4_histogram.png` | Synthetic vs mikrofon ofset histogramı |
| `sekil_6_1_latency.png` | Tanıma gecikme bileşenleri |

> **Not:** Bu figürler sentetik veri üzerinden üretilmiştir;
> tezin son hâlinde gerçek bir şarkıdan alınmış spektrogram ile
> değiştirilmesi tavsiye edilir.

## Mermaid diyagramları (.mmd → PNG)

Aşağıdaki .mmd dosyaları metin tabanlı diyagram açıklamalarıdır.
Render etmek için iki yol vardır:

### Yol 1: mermaid.live (önerilen, kurulum gerekmez)

1. https://mermaid.live/ adresini aç.
2. Soldaki kod alanına dosya içeriğini yapıştır.
3. Sağdaki önizlemeden "Actions" → "PNG" ile indir.
4. PNG'yi bu klasöre aynı isimle kaydet.

### Yol 2: VSCode Mermaid eklentisi

`Markdown Preview Mermaid Support` eklentisini kur, .mmd dosyasını
açıp önizlemeden ekran görüntüsü al.

### Yol 3: Mermaid CLI (toplu render)

```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i sekil_2_1_prisma.mmd -o sekil_2_1_prisma.png -w 1600
mmdc -i sekil_4_1_bilesen.mmd -o sekil_4_1_bilesen.png -w 1600
mmdc -i sekil_4_2_er_diyagrami.mmd -o sekil_4_2_er_diyagrami.png -w 1600
mmdc -i sekil_4_3_tanima_akisi.mmd -o sekil_4_3_tanima_akisi.png -w 1600
```

> Bu yol Chrome/Chromium indirir (~200 MB), ilk kullanım yavaş olabilir.

### Mermaid kaynak dosyaları

| Dosya | Diyagram türü | Tezdeki yeri |
|---|---|---|
| `sekil_2_1_prisma.mmd` | Flowchart | Bölüm 2.1.3 |
| `sekil_4_1_bilesen.mmd` | Flowchart | Bölüm 4.1.1 |
| `sekil_4_2_er_diyagrami.mmd` | ER diagram | Bölüm 4.2.1 |
| `sekil_4_3_tanima_akisi.mmd` | Sequence | Bölüm 4.5 |

## Eklenecek figürler (manuel)

Aşağıdaki figürler manuel olarak hazırlanmalıdır:

- **Ekran görüntüleri (Ek)**: ana sayfa, kayıt UI, sonuç ekranı,
  admin paneli, çalma listesi sayfası
- **Sistem aktivitesi panosu**: `docker stats` çıktısının
  ekran görüntüsü (Bölüm 6.3.3 için)
- **Lighthouse skoru**: Frontend için Chrome Lighthouse raporu

## Çizelgeler

Tüm çizelgeler markdown formatında ilgili .md dosyalarında
yer almaktadır. Word'e aktarımda doğrudan kopyalanabilir.
