# Claude Handoff

Bu dokuman Atify projesinde baska bir yapay zekanin veya yeni bir gelistiricinin hizli sekilde ortama hakim olmasi icin hazirlandi.

## 1. Proje Konumu

Lokal ana klasor:

```text
C:\Users\atala\Desktop\Atify
```

Git repo / backend klasoru:

```text
C:\Users\atala\Desktop\Atify\backend
```

## 2. Git Bilgisi

Remote:

```text
Atify_projesi -> https://github.com/ShaNuva66/Atify.git
```

Calisilan branch:

```text
master
```

## 3. Production Bilgileri

Domain:

```text
https://atify.com.tr
https://www.atify.com.tr
```

Sunucu IP:

```text
89.47.113.106
```

Sunucu:

```text
Ubuntu 24.04
```

## 4. Sunucuya Baglanma

Su an kullanilmasi gereken hesap:

```text
atify
```

Tercih edilen SSH baglantisi:

```powershell
ssh -i "$env:USERPROFILE\.ssh\atify_prod_ed25519" atify@89.47.113.106
```

Notlar:

- Root hesabi vardir ama gunluk deploy ve kontrol icin kullanilmasi tercih edilmez.
- En dogru akış `atify` kullanicisi + SSH key ile calismaktir.

## 5. Sunucudaki Proje Dizini

Guncel aktif production dizini:

```text
/opt/atify
```

Eski bootstrap kaynagi:

```text
/root/atify
```

Not:

- Artik guncel deploy akisi `/opt/atify` icin dusunulmeli.
- `/root/atify` sadece ilk kurulumdan kalan kaynak dizin olabilir.

## 6. Production Deploy Nasil Yapiliyor

Windows tarafindan kullanilan ana deploy komutu:

```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\atala\Desktop\Atify\backend\ops\sync-prod.ps1 -Server atify@89.47.113.106 -RemoteDir /opt/atify -IdentityFile "$env:USERPROFILE\.ssh\atify_prod_ed25519"
```

Bu komut sunlari yapar:

1. Repo `HEAD` durumunu `tar` olarak archive eder
2. Sunucuya yollar
3. Sunucudaki `/opt/atify` altina acar
4. `.env.prod` dosyasini korur
5. `deploy/start-prod.sh` calistirir

Onemli:

- `sync-prod.ps1` dosyasinin varsayilan degerleri eski root akisini gosteriyor olabilir
- Bu projede deploy ederken her zaman explicit olarak sunu kullan:
  - `-Server atify@89.47.113.106`
  - `-RemoteDir /opt/atify`
  - `-IdentityFile "$env:USERPROFILE\.ssh\atify_prod_ed25519"`

## 7. Sunucuda Elle Deploy / Guncelleme

Sunucuya girdikten sonra:

```bash
cd /opt/atify
```

Elle start/redeploy:

```bash
bash /opt/atify/deploy/start-prod.sh
```

Git tabanli update:

```bash
bash /opt/atify/deploy/update-prod.sh
```

## 8. Stack Mimarisi

Production `docker-compose.prod.yml` servisleri:

- `mysql`
- `recognizer`
- `backend`
- `caddy`

Container isimleri:

- `atify-prod-mysql`
- `atify-prod-recognizer`
- `atify-prod-backend`
- `atify-prod-caddy`

Roller:

- `mysql`: uygulama veritabani
- `recognizer`: fingerprint / tanima servisi
- `backend`: Spring Boot uygulamasi + static frontend
- `caddy`: reverse proxy + HTTPS

## 9. Production Kontrol Komutlari

Servis durumu:

```bash
docker compose -f /opt/atify/docker-compose.prod.yml --env-file /opt/atify/.env.prod ps
```

Backend log:

```bash
docker compose -f /opt/atify/docker-compose.prod.yml --env-file /opt/atify/.env.prod logs backend --tail 50
```

Caddy log:

```bash
docker compose -f /opt/atify/docker-compose.prod.yml --env-file /opt/atify/.env.prod logs caddy --tail 50
```

Recognizer log:

```bash
docker compose -f /opt/atify/docker-compose.prod.yml --env-file /opt/atify/.env.prod logs recognizer --tail 50
```

HTTP kontrol:

```bash
curl -I https://atify.com.tr
curl -I https://www.atify.com.tr
```

## 10. Ortam Sirlari

Production sirlar / ortam degiskenleri:

```text
/opt/atify/.env.prod
```

Kural:

- `.env.prod` icerigini chat'e kopyalama
- Deploy script'leri bu dosyayi mevcut haliyle kullanir
- Gerekmiyorsa secret degerlerini ekrana bastirma

## 11. Caddy / Domain Akisi

Dosya:

```text
/opt/atify/deploy/Caddyfile
```

Mantik:

- `atify.com.tr` ve `www.atify.com.tr` tek Caddy config icinde
- HTTPS otomatik
- trafik `backend:8080` a reverse proxy ile gidiyor

## 12. Build / Runtime Notlari

Backend:

- Spring Boot
- Java 17
- static frontend ayni uygulama icinden servis ediliyor

Recognizer:

- Python 3.11 container

DB:

- MySQL 8.4

## 13. Guncel Ozellik Durumu

Bu noktada sistemde bilinen aktif ozellikler:

- Admin ve kullanici girisi tek login formunda birlestirildi
- Rol secimi frontendde ayri sayfa degil; login cevabindaki role gore UI aciliyor
- Jamendo import akisi var
- Fingerprint tanima servisi entegre
- Fingerprint admin durumu ve reindex endpoint'leri mevcut
- Mobil ve desktop responsive iyilestirmeleri yapildi
- Turkish text / mojibake sorunlari buyuk oranda temizlendi
- 403 / gecersiz token durumlarinda oturum temiz kapanacak sekilde duzeltildi

## 14. Test Komutlari

Compile:

```powershell
.\mvnw.cmd -q -DskipTests compile
```

UI smoke:

```powershell
python .\ops\ui_smoke.py --base-url https://atify.com.tr --mode both --ssh-host 89.47.113.106 --ssh-user atify --ssh-key "$env:USERPROFILE\.ssh\atify_prod_ed25519"
```

Fingerprint live smoke:

```powershell
python .\ops\fingerprint_live_smoke.py --base-url https://atify.com.tr --ssh-host 89.47.113.106 --ssh-user atify --ssh-key "$env:USERPROFILE\.ssh\atify_prod_ed25519"
```

Not:

- UI smoke temp user ve temp admin olusturur
- Admin rolunu SSH uzerinden DB'ye ekler
- Test bitince temp kullanicilari temizler

## 15. Siklikla Karsilasilan Durumlar

1. Deploy sonrasi kisa sureli `502`

- Backend restart olurken birkac saniye / bazen ~20-40 saniye gecici `502` gorulebilir
- Hemen panik yapma; once `backend` log ve `docker compose ps` kontrol et

2. Eski JS cache'de kalmasi

- Frontend degistiyse `Ctrl+F5` gerekebilir
- Mobilde sayfayi tamamen kapatip yeniden acmak gerekebilir

3. Docker Compose default root akisi ile deploy etme

- `sync-prod.ps1` explicit parametrelerle calistirilmali
- Guncel hedef `atify@89.47.113.106:/opt/atify`

4. `.env.prod` yi ezme

- Production env dosyasini replase etme
- Gerekmiyorsa sadece mevcut dosyayi koru

## 16. Claude Icin Calisma Kurali

Claude bu projede calisacaksa asagidaki kurallari izlemeli:

1. Lokal repo olarak `C:\Users\atala\Desktop\Atify\backend` i kabul et
2. Production hedef olarak `atify@89.47.113.106:/opt/atify` kullan
3. Sir olarak `.env.prod` yi koru, icerigini isteme veya chat'e dokme
4. Deploy icin once local compile / gerekirse smoke, sonra `sync-prod.ps1` kullan
5. Canli sorunda ilk bakilacak yer:
   - `docker compose ps`
   - backend log
   - caddy log
6. UI ile ilgili degisiklikte `ui_smoke.py`
7. Fingerprint ile ilgili degisiklikte `fingerprint_live_smoke.py`

## 17. Claude'a Direkt Yapistirilacak Kisa Not

Asagidaki blok dogrudan Claude'a verilebilir:

```text
Atify projesinde calisiyorsun.

Lokal repo:
C:\Users\atala\Desktop\Atify\backend

Git remote:
Atify_projesi -> https://github.com/ShaNuva66/Atify.git
Branch:
master

Production:
Domain: https://atify.com.tr
WWW: https://www.atify.com.tr
Server IP: 89.47.113.106
SSH user: atify
SSH key: C:\Users\atala\.ssh\atify_prod_ed25519
Remote app dir: /opt/atify

SSH:
ssh -i "$env:USERPROFILE\.ssh\atify_prod_ed25519" atify@89.47.113.106

Deploy:
powershell -ExecutionPolicy Bypass -File C:\Users\atala\Desktop\Atify\backend\ops\sync-prod.ps1 -Server atify@89.47.113.106 -RemoteDir /opt/atify -IdentityFile "$env:USERPROFILE\.ssh\atify_prod_ed25519"

Production stack:
- atify-prod-mysql
- atify-prod-recognizer
- atify-prod-backend
- atify-prod-caddy

Kontrol:
docker compose -f /opt/atify/docker-compose.prod.yml --env-file /opt/atify/.env.prod ps
docker compose -f /opt/atify/docker-compose.prod.yml --env-file /opt/atify/.env.prod logs backend --tail 50
docker compose -f /opt/atify/docker-compose.prod.yml --env-file /opt/atify/.env.prod logs caddy --tail 50

Kurallar:
- .env.prod icerigini chat'e dokme
- deploy sonrasi gecici 502 olabilir, once backend tam ayağa kalksin
- admin ve kullanici tek login formu kullaniyor, rol login cevabindan geliyor
- UI degisikliklerinde ui_smoke.py, fingerprint degisikliklerinde fingerprint_live_smoke.py kullan
```
