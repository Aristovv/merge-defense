#!/usr/bin/env bash
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "Run as root (the current Timeweb SSH user)."; exit 1; }
command -v git >/dev/null
command -v node >/dev/null
command -v pm2 >/dev/null
command -v flock >/dev/null
command -v crontab >/dev/null || { echo "Cron is not installed"; exit 1; }
[ -d /opt/merge-defense/.git ] || { echo "Repo missing"; exit 1; }
JOB='/opt/merge-defense/scripts/casino-auto-deploy.sh'
CURRENT="$(crontab -l 2>/dev/null || true)"
if printf '%s\n' "$CURRENT" | grep -Fq "$JOB"; then
  echo "Casino City automatic deployment already configured."
  exit 0
fi
{
  printf '%s\n' "$CURRENT"
  printf '*/2 * * * * PATH=%s /bin/bash %s >> /var/log/casino-city-auto-deploy.log 2>&1\n' "$PATH" "$JOB"
} | crontab -
echo "Casino City updates enabled every 2 minutes from GitHub main."
