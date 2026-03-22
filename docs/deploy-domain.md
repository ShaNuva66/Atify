# Atify Domain Deployment

Bu proje `atify.com.tr` için Docker + Caddy ile production deploy olacak şekilde hazırlandı.

## Bugün doğruladığım durum

- `atify.com.tr` için `2026-03-21` tarihinde DNS sorgusu `NXDOMAIN` dönüyor.
- `www.atify.com.tr` için de aynı anda `NXDOMAIN` dönüyor.

Bu şu anlama geliyor:

1. Domain henüz DNS'te yayınlanmamış olabilir.
2. Ya da A kaydı / nameserver ayarı henüz yapılmamış olabilir.

## Bu repo içinde hazır olanlar

1. `docker-compose.prod.yml`
   - MySQL
   - recognizer
   - Spring Boot backend
   - Caddy reverse proxy + otomatik HTTPS

2. `deploy/Caddyfile`
   - `atify.com.tr`
   - `www.atify.com.tr`
   - Let's Encrypt HTTPS

3. `application-prod.properties`
   - prod profil ayarları

4. `.env.prod.example`
   - production secret ve domain örneği

## Sunucuda çalıştırma

Sunucuda Docker ve Docker Compose plugin kurulu olmalı.

### 1. Repo'yu sunucuya kopyala

```bash
git clone <repo-url> atify
cd atify/backend
```

### 2. Env dosyasını oluştur

```bash
cp .env.prod.example .env.prod
```

`.env.prod` içinde en az şunları doldur:

- `APP_DOMAIN=atify.com.tr`
- `LETSENCRYPT_EMAIL=...`
- `MYSQL_ROOT_PASSWORD=...`
- `JWT_SECRET=...`
- `JAMENDO_CLIENT_ID=...`

### 3. Stack'i ayağa kaldır

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

### 4. Log kontrolü

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f
```

## DNS tarafında yapılacaklar

Domain panelinde şu kayıtları sunucu IP'sine yönlendir:

1. `A  @    -> <SUNUCU_IP>`
2. `A  www  -> <SUNUCU_IP>`

Sunucuda şu portlar açık olmalı:

1. `80/tcp`
2. `443/tcp`

## Notlar

1. Uygulama şu an aynı origin'den servis ediliyor.
   - Yani frontend ayrı host değil, backend static dosyaları da aynı domainden veriyor.

2. CORS prod'da şu origin'lere açılıyor:
   - `https://atify.com.tr`
   - `https://www.atify.com.tr`

3. Deploy stack içindeki recognizer şu an `mock_recognizer.py`.
   - Gerçek tanıma servisine geçilecekse bu container onunla değiştirilmeli.

4. Upload ve temp klasörleri container içinde `/data` altında tutuluyor.

## Hızlı kontrol

Deploy sonrası:

```bash
curl -I https://atify.com.tr
curl -I https://www.atify.com.tr
```

Beklenen sonuç: `200` veya redirect sonrası `200`.
