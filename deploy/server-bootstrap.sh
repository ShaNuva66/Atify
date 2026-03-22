#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release unzip docker.io docker-compose-v2

systemctl enable docker
systemctl start docker

mkdir -p /root/atify

if command -v ufw >/dev/null 2>&1; then
  ufw allow 22/tcp || true
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
fi

docker --version
docker compose version
echo "Bootstrap tamam. Projeyi /root/atify altina kopyalayip deploy edebilirsin."
