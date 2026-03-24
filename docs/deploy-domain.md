# Atify Production Deploy

Bu dokuman `atify.com.tr` uzerinde calisan production kurulumu icin hazirlandi.

## Mimari

- `mysql`: uygulama veritabani
- `recognizer`: mock tanima servisi
- `backend`: Spring Boot uygulamasi
- `caddy`: reverse proxy ve otomatik HTTPS

## Gerekenler

- Ubuntu 22.04 veya 24.04
- Docker
- Docker Compose plugin
- Domain DNS kayitlari

## Sunucu dizin yapisi

Sunucuda repo dizini:

```bash
/root/atify
```

Ana dosyalar:

- `docker-compose.prod.yml`
- `.env.prod`
- `deploy/start-prod.sh`
- `deploy/update-prod.sh`
- `deploy/backup-prod.sh`
- `deploy/harden-server.sh`

## Ilk kurulum

Sunucu bootstrap:

```bash
chmod +x /root/atify/deploy/*.sh
/root/atify/deploy/server-bootstrap.sh
```

Ilk deploy:

```bash
/root/atify/deploy/start-prod.sh
```

## DNS

Asagidaki kayitlar domain panelinde bulunmali:

```text
A   @     <SUNUCU_IP>
A   www   <SUNUCU_IP>
```

Notlar:

- `@` veya `www` icin eski cakisan `A`, `AAAA` veya `CNAME` kayitlari kalmamali
- DNSSEC problem cikariyorsa gecici olarak kapatilabilir

## Guncelleme

Repoya yeni commit geldikten sonra:

```bash
/root/atify/deploy/update-prod.sh
```

Bu script:

1. `git pull --ff-only` yapar
2. container'lari rebuild eder
3. servis durumunu ve son loglari gosterir

## Yedek Alma

Veritabani ve medya yedegi:

```bash
/root/atify/deploy/backup-prod.sh
```

Yedekler:

```bash
/root/atify/backups
```

altina yazilir.

## Sunucu Guvenligi

Deploy kullanicisi ve temel sertlestirme:

```bash
DEPLOY_USER=atify DEPLOY_PUBLIC_KEY="<ssh-public-key>" /root/atify/deploy/harden-server.sh
```

Script sunlari yapar:

1. `atify` kullanicisini olusturur
2. `sudo` ve `docker` grubuna ekler
3. public key'i `authorized_keys` icine yazar
4. `fail2ban` ve `unattended-upgrades` kurar
5. `atify-update` ve `atify-backup` kisayollarini olusturur

Uyari:

- yeni kullanici ile SSH girisini test etmeden root login'i kapatma
- root sifresini ekran goruntulerinde paylasma

## Hizli Kontrol

Servisler:

```bash
docker compose -f /root/atify/docker-compose.prod.yml --env-file /root/atify/.env.prod ps
```

Caddy log:

```bash
docker compose -f /root/atify/docker-compose.prod.yml --env-file /root/atify/.env.prod logs caddy --tail 50
```

Backend log:

```bash
docker compose -f /root/atify/docker-compose.prod.yml --env-file /root/atify/.env.prod logs backend --tail 50
```

HTTP test:

```bash
curl -I http://atify.com.tr
curl -I https://atify.com.tr
```

## Ilk Admin Kullanici

Production veritabani bos gelirse:

1. web arayuzunden normal kullanici kaydi olustur
2. MySQL icinde kullanicinin `id` degerini bul
3. ilgili kullaniciya `ADMIN` rolunu ekle

Ornek:

```sql
USE atify;
SELECT id, username, email FROM app_user;
INSERT INTO user_roles (user_id, roles) VALUES (1, 'ADMIN');
```
