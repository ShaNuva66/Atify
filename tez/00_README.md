# Atify — Bitirme Tezi Taslağı

> Bu klasör, Atalay AKSOY'un Düzce Üniversitesi Bilgisayar Mühendisliği
> Bölümü BM498 Mezuniyet Tezi için yazılmış taslak metinleri içerir.
> Tüm bölümler markdown formatında yazılmış olup, son derlemede Düzce
> Üniversitesi'nin resmi Word şablonuna (`tez_Düzce.docx`) aktarılacaktır.

## Bölümler ve durum

| Dosya | Bölüm | Tahminî sayfa | Durum |
|---|---|---|---|
| [01_giris.md](01_giris.md) | 1. Giriş | ~3 | Yazıldı (taslak) |
| [02_literatur.md](02_literatur.md) | 2. Literatür Taraması | ~8 | Yazıldı (taslak) |
| [03_materyal_yontem.md](03_materyal_yontem.md) | 3. Materyal ve Yöntem | ~6 | Yazıldı (taslak) |
| [04_sistem_mimarisi.md](04_sistem_mimarisi.md) | 4. Sistem Mimarisi | ~8 | Yazıldı (taslak) |
| [05_algoritma.md](05_algoritma.md) | 5. Akustik Parmak İzi Algoritması | ~9 | Yazıldı (taslak) |
| [06_bulgular.md](06_bulgular.md) | 6. Bulgular ve Tartışma | ~9 | Yazıldı (taslak) |
| [07_sonuclar.md](07_sonuclar.md) | 7. Sonuçlar ve Öneriler | ~6 | Yazıldı (taslak) |
| [08_kaynaklar.md](08_kaynaklar.md) | 8. Kaynaklar (IEEE) | ~4 | Yazıldı (taslak) |
| [09_ozet_abstract.md](09_ozet_abstract.md) | Özet, Abstract, Kapak, Beyanlar | ~5 | Yazıldı (taslak) |

**Toplam tahmini sayfa:** ~58

## Yapılacaklar (sıra ile)

### 1. Revizyon turu (geliştirici tarafından)

- [ ] Her bölümün okunması, ekleme/çıkarma/düzeltme isteklerinin
      işaretlenmesi
- [ ] Eksik referansların tezde gerçekten kullanıldığının doğrulanması
      (kullanılmayanların kaynakçadan çıkarılması)
- [ ] Sayısal değerlerin ve tarihlerin son hâlleriyle güncellenmesi
- [ ] Cümlelerin akıcılık ve dilbilgisi kontrolü

### 2. Görseller

- [ ] **Şekil 2.1** — PRISMA akış şeması (Mermaid/Draw.io)
- [ ] **Şekil 4.1** — Sistem bileşen şeması
- [ ] **Şekil 4.2** — ER diyagramı (MySQL Workbench veya dbdiagram.io)
- [ ] **Şekil 4.3** — Şarkı tanıma akış (sequence diyagramı)
- [ ] **Şekil 5.1** — STFT spektrogram örneği
- [ ] **Şekil 5.2** — Tepe noktası seçimi görseli
- [ ] **Şekil 5.3** — Anchor-target hash görseli
- [ ] **Şekil 5.4** — Ofset histogramı (synthetic vs mikrofon)
- [ ] **Şekil 6.1** — Tanıma gecikme dağılımı
- [ ] Ekran görüntüleri (Ek): ana sayfa, kayıt UI, sonuç ekranı,
      admin paneli, vs.

### 3. Ölçüm ve test verileri

- [ ] 10 şarkı üzerinden synthetic test sonuçları tablosu
- [ ] 10 şarkı üzerinden mikrofon testi sonuçları tablosu
- [ ] Hash sayısı dağılım grafiği (histogram)
- [ ] Soğuk başlatma süresi ölçüm tablosu

### 4. Kaynakça

- [ ] Mendeley'de yeni proje açıp kaynakları girmek
- [ ] IEEE stili (Türkçe dil ayarı) seçmek
- [ ] Tezdeki [@xxx] biçimindeki yer tutucuları gerçek atıflara
      dönüştürmek
- [ ] Atıf yapılmamış kaynakları listeden çıkarmak

### 5. Word'e aktarım

- [ ] `tez_Düzce.docx` şablonunu kopyala (`tez_atify_v1.docx` adıyla)
- [ ] Kapak sayfasını [09_ozet_abstract.md](09_ozet_abstract.md)
      kapak bilgileriyle doldur
- [ ] Beyan, ÜYZ beyanı, Teşekkür sayfalarını doldur
- [ ] Özet ve Abstract sayfalarını yerleştir
- [ ] Bölüm 1-7'yi sırasıyla aktarır, şablonun otomatik
      numaralandırılan başlıklarını kullan
- [ ] Şekil/çizelge/denklem otomatik atıflarını kontrol et
- [ ] Mendeley üzerinden kaynakça otomatik oluştur
- [ ] İçindekiler tablosu güncelle (Ctrl+A → F9)

### 6. Son kontroller

- [ ] İntihal kontrolü (Turnitin / iThenticate)
- [ ] Tez yazım kılavuzuna göre format kontrolü
- [ ] PDF çıktısı oluşturma
- [ ] Danışman gözden geçirmesi

## Süre planı (1 ay)

| Hafta | İş |
|---|---|
| 1 | Tüm bölümlerin revizyonu, eksik bilgilerin tamamlanması |
| 2 | Görsellerin çizilmesi ve eklenmesi, ölçüm tablolarının yapılması |
| 3 | Mendeley kurulumu, kaynakça düzenlemesi, Word'e aktarım |
| 4 | İntihal kontrolü, format düzeltmeleri, danışman onayı, teslim |

## Notlar

- Tüm metinler Türkçe yazılmıştır.
- Akademik üslup: 1. tekil değil, edilgen veya 1. çoğul tercih edilmiştir.
- Kaynak gösterimi IEEE numerik teknik (`[1]`, `[2]`...) ile yapılacaktır.
- Tez yazım kılavuzunun jüri değerlendirme tablosundaki kriterlerin
  her biri (PRISMA, blok şema, FAIR, etik, ISO) tez metninde
  açıkça karşılanacak şekilde tasarlanmıştır.
