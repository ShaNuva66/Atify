# Atify Backend

Atify, Spring Boot tabanli muzik uygulamasi backend'idir. Static frontend dosyalari da ayni uygulama icinden servis edilir.

## Lokal gelistirme

```bash
./mvnw spring-boot:run
```

Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

## Test

```bash
./mvnw test
```

UI smoke testi:

```powershell
python .\ops\ui_smoke.py `
  --base-url https://atify.com.tr `
  --mode both `
  --ssh-host 89.47.113.106 `
  --ssh-user atify `
  --ssh-key "$env:USERPROFILE\.ssh\atify_prod_ed25519"
```

Notlar:

- Script temp user ve temp admin hesabi olusturur.
- Admin hesabini SSH uzerinden `user_roles` tablosuna ekler.
- Is bitince temp hesaplari temizler.
- `selenium` ve `requests` kurulu bir Python ortami bekler.
- Screenshot almak istersen `--artifacts-dir .\tmp\ui-smoke` ekleyebilirsin.

## Production

Production deploy ve operasyon notlari:

- [docs/deploy-domain.md](docs/deploy-domain.md)

Ana script'ler:

- `deploy/server-bootstrap.sh`
- `deploy/start-prod.sh`
- `deploy/update-prod.sh`
- `deploy/backup-prod.sh`
- `deploy/harden-server.sh`
- `ops/sync-prod.ps1`
- `ops/setup-prod-access.ps1`
