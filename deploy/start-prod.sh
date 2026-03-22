#!/usr/bin/env bash
set -euo pipefail

cd /root/atify

if [[ ! -f .env.prod ]]; then
  echo ".env.prod bulunamadi"
  exit 1
fi

docker compose -f docker-compose.prod.yml --env-file .env.prod down || true
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
