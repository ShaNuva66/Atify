# 1. GİRİŞ

## 1.1. Problemin Tanımı

Dijital müzik tüketiminin yaygınlaşmasıyla birlikte, kullanıcılar gün içinde
karşılaştıkları bir şarkıyı tanımlama ihtiyacını giderek artan bir sıklıkta
duymaya başlamıştır. Radyoda çalan, bir kafede arka planda duyulan veya
sosyal medya videolarında geçen müzik parçalarının başlık ve sanatçı
bilgilerine erişebilmek için ticari olarak Shazam, SoundHound ve Apple
Music gibi servisler kullanılmaktadır. Ancak bu servislerin tamamı
kapalı kaynak kodlu, merkezi mimariye sahip ve ulusal kullanıcı verisini
yurt dışı sunucularda tutan platformlardır. Aynı zamanda mevcut müzik
akış platformlarının (Spotify, YouTube Music vb.) büyük çoğunluğu da
yurt dışı menşeli olup; sanatçı kazanç paylaşımı, telif hakkı yönetimi
ve yerel dil desteği gibi konularda Türkiye pazarına özgü ihtiyaçları
yeterince karşılayamamaktadır.

Bu noktada üç farklı problem birleşmektedir:

1. **Açık kaynaklı, yerli bir müzik akış platformu eksikliği:** Spring
   Boot ve modern web teknolojileriyle geliştirilmiş, kullanıcı yönetimi,
   şarkı/sanatçı/albüm yönetimi, çalma listesi ve dinleme geçmişi
   bileşenleriyle uçtan uca bir referans uygulamanın akademik
   literatürde Türkçe olarak detaylı şekilde belgelenmemiş olması.
2. **Şarkı tanıma teknolojisinin platforma entegrasyonu:** Akustik
   parmak izi (audio fingerprinting) algoritmalarının teorik olarak
   bilinmesine rağmen, gerçek bir prodüksiyon ortamında düşük
   gecikme süresiyle, çok kullanıcılı erişim altında ve gürültülü
   mikrofon kayıtlarını dahi tanıyabilecek şekilde mikroservis
   mimarisinde uygulanmasının pratik zorlukları.
3. **Sürdürülebilir, ölçeklenebilir bir mimari:** Üretim ortamında
   sürekli teslim (continuous delivery), otomatik HTTPS sertifikası
   yönetimi, container tabanlı izolasyon ve gözlemlenebilirlik
   (observability) ihtiyaçlarının lisans seviyesinde bir bitirme
   tezi kapsamında bütüncül olarak ele alınması.

Tez kapsamında geliştirilen **Atify** adlı sistem, bu üç problemi tek
bir uygulama içinde çözmeyi amaçlamaktadır. Atify; Spring Boot tabanlı
bir arka uç (backend), Python/Flask tabanlı bir akustik parmak izi
servisi (recognizer), MySQL veri tabanı, Caddy ters vekil sunucusu
ve vanilla JavaScript ile geliştirilmiş bir tek sayfa uygulaması
(SPA) ön yüzünden oluşan tam yığın (full-stack) bir müzik
platformudur. Sistem, `https://atify.com.tr` alan adı altında
gerçek bir VPS sunucusunda canlı yayın hâlinde çalışmaktadır.

## 1.2. Tezin Amacı

Bu tezin temel amacı, akademik bir bitirme tezi kapsamında üretim
seviyesinde bir müzik akış platformu tasarlamak, geliştirmek,
dağıtmak ve performansını ölçmektir. Bu kapsamda alt amaçlar şu
şekilde tanımlanmıştır:

- Modern Java ekosisteminin (Spring Boot 3.x, JPA/Hibernate, Spring
  Security + JWT) bir müzik platformu örnek olayı üzerinden
  öğrenilmesi ve uygulanması.
- Shazam tarafından 2003 yılında Avery Wang [@wang2003] tarafından
  önerilen *landmark fingerprinting* algoritmasının Türkçe
  literatüre detaylı bir biçimde aktarılması ve Python referans
  uygulamasının açık kaynak olarak yayımlanması.
- Mikroservis mimarisinin pratik avantajlarının (bağımsız
  ölçeklendirme, dil bağımsızlığı, izolasyon) ve dezavantajlarının
  (ağ gecikmesi, dağıtık veri tutarlılığı) gerçek bir uygulama
  üzerinde gözlemlenmesi.
- Sürekli teslim (CI/CD) iş akışının `git archive` + SCP +
  `docker compose` zincirinde minimal araç bağımlılığıyla
  kurulması ve dağıtım sürecinin otomatize edilmesi.
- Üretim ortamında karşılaşılan tutarlılık problemlerinin
  (algoritma sürüm yükseltmesi sırasında katalog senkronizasyonu,
  eşzamanlı tanıma istekleri sırasında oluşan veri yarışı) tespit
  edilip kalıcı şekilde çözülmesi.

## 1.3. Literatüre Katkı

Bu tezin literatüre yapması beklenen katkılar şunlardır:

1. **Türkçe akademik kaynak:** Akustik parmak izi algoritmaları
   üzerine yazılmış lisans seviyesinde Türkçe akademik tezlerin
   sayısı oldukça sınırlıdır. Bu çalışma, Wang'ın orijinal
   algoritmasının ve takip eden iyileştirmelerin (Chromaprint
   [@lalinsky2010], Echoprint [@echoprint2011]) Türkçe terimleriyle
   birlikte ayrıntılı şekilde anlatıldığı bir referans
   sağlamaktadır.
2. **Üretim seviyesinde uygulama belgesi:** Akademik tezlerin
   önemli bir kısmı yalnızca yerel ortamda çalışan prototiplerle
   sınırlı kalmaktadır. Bu çalışma, kamuya açık bir alan adı
   üzerinden 7/24 erişilebilen, otomatik HTTPS sertifikalı, Docker
   Compose ile orkestre edilen bir uygulamayı uçtan uca
   belgelemektedir.
3. **Operasyonel sorun günlüğü:** Tez yazım sürecinde tespit edilip
   çözülen iki adet üretim hatasının (parmak izi sürüm geçişinde
   katalog tutarsızlığı ve recognizer servisinde dict modifikasyon
   yarışı) kök neden analizi ile birlikte sunulması, benzer
   sistemleri geliştirecek araştırmacılar için somut bir kontrol
   listesi sağlamaktadır.
4. **FAIR ilkelerine uygun açık veri:** Tez kapsamında kullanılan
   şarkı kataloğu Jamendo'nun Creative Commons lisanslı kataloğundan
   alınmış olup, tez raporuyla birlikte kullanılan veri kümesi,
   parmak izi vektörleri ve değerlendirme betikleri açık bir
   biçimde paylaşılacaktır.

## 1.4. Tezin Düzeni

Tez sekiz bölüm hâlinde düzenlenmiştir. **Bölüm 2**'de akustik parmak
izi ve müzik akış platformları üzerine yapılan literatür taraması
PRISMA yöntemine uygun şekilde sunulmuştur. **Bölüm 3**'te uygulama
geliştirmede kullanılan materyal ve yöntemler (programlama dilleri,
çatılar, kütüphaneler, geliştirme ortamı) açıklanmıştır. **Bölüm 4**,
sistemin genel mimarisini blok şeması, veri tabanı şeması ve
bileşenler arası iletişim diyagramları ile ayrıntılı olarak
incelemektedir. **Bölüm 5**, tezin teknik kalbi olan akustik parmak
izi algoritmasının matematiksel formülasyonunu ve Atify projesinde
kullanılan parametre ayarlarını ele almaktadır. **Bölüm 6**'da
üretim ortamında elde edilen ölçüm sonuçları (tanıma doğruluğu,
gecikme dağılımı, kaynak tüketimi) tartışılmaktadır. **Bölüm 7**
sonuç ve önerileri sunarken, **Bölüm 8** kullanılan kaynakları
listelemektedir. Tezin kod parçacıkları, REST API dokümantasyonu
ve ekran görüntüleri **Bölüm 9 (Ekler)**'de yer almaktadır.
