#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl git gnupg lsb-release unzip docker.io docker-compose-v2 fail2ban unattended-upgrades

systemctl enable docker
systemctl start docker
systemctl enable fail2ban || true
systemctl start fail2ban || true

mkdir -p /root/atify

if command -v ufw >/dev/null 2>&1; then
  ufw allow 22/tcp || true
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
fi

docker --version
docker compose version
echo "Bootstrap tamam. Git, Docker, fail2ban ve unattended-upgrades hazir."
echo "Projeyi /root/atify altina kopyalayip deploy edebilirsin."
