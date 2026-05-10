# Atify Telif ve Lisans Uyumlulugu

Bu not Atify web + mobil uygulamasinda muzik icerigi yayinlanirken telif riskini azaltmak icin uygulanacak kurallari tanimlar.

## Zorunlu urun kurallari

1. Jamendo parcasi uygulamaya alinacaksa `jamendoId`, `audioUrl` ve `licenseUrl` zorunludur.
2. Jamendo parcasi icin `shareUrl` ve `licenseUrl` veritabaninda saklanir.
3. Mobil uygulama her sarki satirinda kaynak/hak durumunu gosterir.
4. Mobil uygulama lisans linki varsa kullaniciya acilabilir bir `Lisans` aksiyonu sunar.
5. Uygulamada muzik indirme, disari aktarma veya dosya paylasma ozelligi olmamalidir.
6. Yerel yuklenen her parca icin yayin/stream hakki Atify tarafindan ayrica belgelenmelidir.
7. Store ekran goruntulerinde ve tanitim metinlerinde hakki kanitlanmamis album kapagi, sanatci fotografi veya marka kullanilmamalidir.

## Jamendo kullanimi

Jamendo API icerikleri Creative Commons lisanslariyla gelir; her parcanin kendi lisans kosulu vardir. Bu nedenle lisans URL'i saklanmadan katalog import edilmez.

Ticari kullanim, reklam, abonelik veya gelir modeli planlanirsa Jamendo API/icerik kullanimi icin Jamendo'dan uygun izin veya lisans dogrulanmalidir.

## Yerel yukleme

Admin panelinden yuklenen dosyalar icin minimum kayit:

- Eser adi
- Sanatci
- Hak sahibi veya izin veren kisi/kurum
- Izin/lisans belgesi
- Izin kapsamı: stream, mobil, web, ulke, sure, ticari kullanim

Bu kanit olmadan parca production kataloguna eklenmemelidir.

## Magaza notlari

Google Play ve Apple, izinsiz telifli icerik, kapak gorseli, marka kullanimi, download/yerel kopya ve ucuncu taraf servis kosullarini ihlal eden uygulamalari reddedebilir veya kaldirabilir.

Yayin oncesi:

- Gizlilik politikasi linki hazirlanmali.
- Mikrofon izni aciklamasi sarki tanima amacini soylemeli.
- Store listing "muzik indirme" veya "her sarkiyi ucretsiz dinle" gibi riskli ifadeler icermemeli.
- Gerekirse Jamendo/API veya yerel katalog izin belgeleri review notlarina eklenmeli.

## Teknik korumalar

- `Song.externalUrl` ve `Song.licenseUrl` lisans kaniti icin saklanir.
- Jamendo import akisi lisans URL olmadan hata verir.
- Mobil `RightsLink` kullaniciya lisans/kaynak linkini acar.
- Oynatici ve liste satirlari hak durumunu gorunur tutar.
