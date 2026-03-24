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
