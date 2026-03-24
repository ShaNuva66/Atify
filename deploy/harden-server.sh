#!/usr/bin/env bash
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-atify}"
DEPLOY_PUBLIC_KEY="${DEPLOY_PUBLIC_KEY:-}"
ATIFY_DIR="${ATIFY_DIR:-/root/atify}"

if [[ "$EUID" -ne 0 ]]; then
  echo "Bu script root olarak calismali."
  exit 1
fi

apt-get update
apt-get install -y fail2ban git unattended-upgrades

if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi

usermod -aG sudo,docker "$DEPLOY_USER"

DEPLOY_HOME="$(getent passwd "$DEPLOY_USER" | cut -d: -f6)"
mkdir -p "$DEPLOY_HOME/.ssh"
chmod 700 "$DEPLOY_HOME/.ssh"
touch "$DEPLOY_HOME/.ssh/authorized_keys"
chmod 600 "$DEPLOY_HOME/.ssh/authorized_keys"

if [[ -n "$DEPLOY_PUBLIC_KEY" ]]; then
  if ! grep -Fqx "$DEPLOY_PUBLIC_KEY" "$DEPLOY_HOME/.ssh/authorized_keys"; then
    printf '%s\n' "$DEPLOY_PUBLIC_KEY" >> "$DEPLOY_HOME/.ssh/authorized_keys"
  fi
fi

chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_HOME/.ssh"

ln -sf "$ATIFY_DIR/deploy/update-prod.sh" /usr/local/bin/atify-update || true
ln -sf "$ATIFY_DIR/deploy/backup-prod.sh" /usr/local/bin/atify-backup || true

systemctl enable fail2ban || true
systemctl restart fail2ban || true
systemctl enable unattended-upgrades || true
systemctl restart unattended-upgrades || true

echo "Deploy kullanicisi hazir: $DEPLOY_USER"
echo "Docker grubu eklendi."
echo "Update komutu: /usr/local/bin/atify-update"
echo "Backup komutu: /usr/local/bin/atify-backup"
echo "Not: SSH key ile girisi dogrulamadigin surece root login'i kapatma."
