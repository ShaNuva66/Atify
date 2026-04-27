# ÖZET, ABSTRACT, KAPAK BİLGİLERİ

> Bu dosya, tezin Word şablonuna aktarılmadan önce kapak,
> özet ve abstract sayfalarına yerleşecek metinleri içerir.

---

## ÖZET

### AKUSTİK PARMAK İZİ YÖNTEMİ İLE ŞARKI TANIMA ÖZELLİĞİNE SAHİP WEB TABANLI MÜZİK AKIŞ PLATFORMU: ATIFY

**Atalay AKSOY**
**Düzce Üniversitesi**
**Mühendislik Fakültesi, Bilgisayar Mühendisliği Bitirme Tezi**
**Danışman: Dr. Öğr. Üyesi Hüseyin BODUR**
**Mayıs 2026, [sayfa sayısı] sayfa**

Bu tezde, akustik parmak izi tabanlı şarkı tanıma özelliğine sahip,
açık kaynak, Türkçe arayüzlü bir web tabanlı müzik akış
platformu olan **Atify** uçtan uca tasarlanmış, geliştirilmiş ve
canlı bir üretim sunucusuna dağıtılmıştır. Sistem; Spring Boot 3
tabanlı bir arka uç, Python ve Flask tabanlı bir akustik parmak
izi servisi, MySQL veri tabanı, Caddy ters vekil sunucusu ile
vanilla JavaScript kullanılarak geliştirilmiş bir tek sayfa
uygulamasından oluşan tam yığın bir mimariye sahiptir. Akustik
parmak izi algoritması olarak Avery Wang'ın 2003 yılında
yayımlanan landmark hashing yöntemi temel alınmış; mikrofon
kayıtlarındaki dayanıklılığı artırmak için ffmpeg dynaudnorm
filtresi, ikinci-en-iyi marj kontrolü ve simetrik ön işleme
zinciri eklenmiştir. Sistem, üretim ortamında 67 şarkılık bir
katalog ile çalışmakta; synthetic testlerde tamamı doğru tanıma,
mikrofon testlerinde ise gürültü kontrolü uygulandıktan sonra
başarılı tanıma sonuçları üretmektedir. Tez yazımı sürecinde
karşılaşılan üç adet üretim hatası (algoritma sürüm geçişinde
katalog tutarsızlığı, recognizer servisinde veri yarışı ve
katalog senkronizasyonu sırasında servis kesintisi) tespit
edilip kalıcı olarak çözülmüş; bu sorunların çözümü tez
metnine kök neden analizi ile birlikte dahil edilmiştir. Tezin
literatüre temel katkısı, akustik parmak izi algoritmasının
Türkçe akademik metinlere ayrıntılı biçimde aktarılması ve
mikroservis tabanlı bir müzik akış platformunun üretim
seviyesinde belgelenmiş bir vaka çalışmasının sunulmasıdır.
Atify, kamuya açık `https://atify.com.tr` alan adı altında 7/24
erişilebilir durumda olup; kaynak kodu ve değerlendirme
betikleri açık lisansla yayımlanmaktadır.

**Anahtar sözcükler:** Akustik parmak izi, şarkı tanıma, Spring
Boot, mikroservis, müzik akış platformu, Wang algoritması.

---

## ABSTRACT

### A WEB-BASED MUSIC STREAMING PLATFORM WITH ACOUSTIC FINGERPRINT BASED SONG RECOGNITION: ATIFY

**Atalay AKSOY**
**Düzce University**
**Faculty of Engineering, Department of Computer Engineering**
**Undergraduate Thesis**
**Supervisor: Asst. Prof. Dr. Hüseyin BODUR**
**May 2026, [page count] pages**

This thesis presents the end-to-end design, development, and
deployment of **Atify**, an open-source, Turkish-interface,
web-based music streaming platform with built-in acoustic
fingerprint based song recognition. The system follows a
full-stack microservice architecture composed of a Spring Boot 3
backend, a Python/Flask acoustic fingerprint service, a MySQL
database, a Caddy reverse proxy, and a vanilla JavaScript single
page application. The recognition engine is based on Avery
Wang's 2003 landmark hashing algorithm, extended with the
ffmpeg dynaudnorm filter, a second-best margin check, and a
symmetric preprocessing chain to improve robustness against
microphone recordings. The system operates in production with a
67-track catalogue; synthetic queries achieve perfect
recognition, while real-world microphone queries succeed once
proper noise handling is enforced both in the browser and on
the server. During the writing of this thesis, three production
incidents (catalogue inconsistency during algorithm version
upgrades, a race condition in the recognizer service, and a
service interruption caused by full catalogue resets) were
identified and permanently resolved; their root cause analyses
are documented in the thesis. The principal contribution to the
literature is twofold: a detailed Turkish-language exposition
of the landmark hashing algorithm, and a documented case study
of a microservice-based music streaming platform operating at
production level. Atify is publicly accessible 24/7 at
`https://atify.com.tr`, with source code and evaluation
artefacts released under open licences.

**Keywords:** Acoustic fingerprint, song recognition, Spring
Boot, microservices, music streaming, Wang algorithm.

---

## KAPAK BİLGİLERİ

| Alan | Değer |
|---|---|
| Bölüm | Bilgisayar Mühendisliği Bölümü |
| Akademik yıl | 2025-2026 |
| Dönem | Bahar |
| Ders | BM498 Mezuniyet Tezi |
| Ders sorumlusu | Dr. Öğr. Üyesi Hüseyin BODUR |
| Tez başlığı | Akustik Parmak İzi Yöntemi ile Şarkı Tanıma Özelliğine Sahip Web Tabanlı Müzik Akış Platformu: Atify |
| Hazırlayan | Atalay AKSOY |
| Öğrenci numarası | 221002056 |
| Danışman | Dr. Öğr. Üyesi Hüseyin BODUR |
| Tarih (kapak) | Mayıs 2026 |

---

## BEYAN

> Bu tez çalışmasının kendi çalışmam olduğunu, tezin
> planlanmasından yazımına kadar bütün aşamalarda etik dışı
> davranışımın olmadığını, bu tezdeki bütün bilgileri akademik
> ve etik kurallar içinde elde ettiğimi, bu tez çalışmasıyla
> elde edilmeyen bütün bilgi ve yorumlara kaynak gösterdiğimi ve
> bu kaynakları da kaynaklar listesine aldığımı, yine bu tezin
> çalışılması ve yazımı sırasında patent ve telif haklarını ihlal
> edici bir davranışımın olmadığını beyan ederim.

**Tarih:** [tez teslim tarihi]
**(İmza)**
**Atalay AKSOY**

---

## ÜRETKEN YAPAY ZEKA KULLANIM BEYANI

> Bu tez çalışmasını hazırlarken **ChatGPT (OpenAI)** ve
> **Claude (Anthropic)** üretken yapay zekâ programlarından
> destek aldığımı beyan ederim. Tezimin hazırlığı aşamasında bu
> üretken yapay zekâ programlarından (i) **dil çevirisi**,
> (ii) **bilimsel makalelere erişim**, (iii) **kaynak kodun
> Türkçe açıklanması** ve (iv) **akademik ifade kontrolü**
> alanlarında destek aldım. Üretken yapay zekâ programlarından
> aldığım bilgilerin doğruluğunu kontrol ettiğimi bildiririm.
>
> Herhangi bir zamanda, çalışmamla ilgili yaptığım bu beyana
> aykırı bir durumun saptanması durumunda, ortaya çıkacak tüm
> ahlaki ve hukuki sonuçları kabul ettiğimi bildiririm.

**Tarih:** [tez teslim tarihi]
**(İmza)**
**Atalay AKSOY**

---

## TEŞEKKÜR

> Lisans öğrenimim boyunca ve bu tezin hazırlanması sürecinde
> gösterdiği destek, sabır ve değerli yönlendirmeler için
> danışmanım Dr. Öğr. Üyesi Hüseyin BODUR'a en içten
> teşekkürlerimi sunarım.
>
> Bu çalışma boyunca yardımlarını ve desteklerini esirgemeyen
> sevgili aileme ve çalışma arkadaşlarıma sonsuz teşekkürlerimi
> sunarım.
>
> Atify projesinin geliştirme sürecinde açık lisanslı şarkı
> kataloğunu sağlayan **Jamendo Music** topluluğuna ve kullanılan
> tüm açık kaynak yazılım projelerine — Spring Boot, NumPy,
> MySQL, Docker, Caddy, ffmpeg — katkıda bulunan geliştiricilere
> minnettarım.
