#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env.prod ]]; then
  echo ".env.prod bulunamadi"
  exit 1
fi

if [[ -d .git ]]; then
  git fetch --all --prune
  git pull --ff-only
else
  echo "Uyari: .git dizini yok, git pull atlandi."
fi

docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build --remove-orphans
docker compose -f docker-compose.prod.yml --env-file .env.prod ps

echo
echo "Caddy son loglari:"
docker compose -f docker-compose.prod.yml --env-file .env.prod logs caddy --tail 20 || true

echo
echo "Backend son loglari:"
docker compose -f docker-compose.prod.yml --env-file .env.prod logs backend --tail 20 || true
