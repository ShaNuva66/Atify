#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env.prod ]]; then
  echo ".env.prod bulunamadi"
  exit 1
fi

read_env() {
  local key="$1"
  local line
  line="$(grep -E "^${key}=" .env.prod | head -n 1 || true)"
  if [[ -z "$line" ]]; then
    return 1
  fi
  printf '%s' "${line#*=}"
}

MYSQL_DATABASE="$(read_env MYSQL_DATABASE || true)"
MYSQL_ROOT_PASSWORD="$(read_env MYSQL_ROOT_PASSWORD)"
if [[ -z "${MYSQL_DATABASE}" ]]; then
  MYSQL_DATABASE="atify"
fi

BACKUP_DIR="$ROOT_DIR/backups"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DB_BACKUP="$BACKUP_DIR/atify-db-$TIMESTAMP.sql.gz"
MEDIA_BACKUP="$BACKUP_DIR/atify-media-$TIMESTAMP.tar.gz"
MEDIA_VOLUME="$(docker volume ls --format '{{.Name}}' | grep '_atify_prod_media$' | head -n 1 || true)"

mkdir -p "$BACKUP_DIR"

docker exec atify-prod-mysql sh -lc "mysqldump -uroot -p\"\$MYSQL_ROOT_PASSWORD\" \"$MYSQL_DATABASE\"" \
  | gzip > "$DB_BACKUP"

if [[ -z "$MEDIA_VOLUME" ]]; then
  echo "Medya volume'u bulunamadi. Veritabani yedegi alindi."
  echo "Veritabani yedegi: $DB_BACKUP"
  exit 0
fi

docker run --rm \
  -v "$MEDIA_VOLUME:/data:ro" \
  -v "$BACKUP_DIR:/backup" \
  alpine:3.20 \
  sh -lc "cd /data && tar czf /backup/$(basename "$MEDIA_BACKUP") ."

echo "Veritabani yedegi: $DB_BACKUP"
echo "Medya yedegi: $MEDIA_BACKUP"
