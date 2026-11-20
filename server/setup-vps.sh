#!/usr/bin/env bash
# MERGE DEFENSE isolated VPS setup. Does not touch autoempire_final, existing PM2 apps or web proxy.
set -Eeuo pipefail
if [[ "${EUID}" -ne 0 ]]; then echo "Run as root on your VPS"; exit 1; fi
for command in psql openssl git node npm pm2; do
  command -v "$command" >/dev/null || { echo "Missing dependency: $command"; exit 1; }
done
APPDIR=/opt/merge-defense
GITURL=https://github.com/Aristovv/merge-defense.git
DBNAME=merge_defense
DBUSER=merge_defense_app
DBFILE="$APPDIR/server/.env"
mkdir -p /opt
if [[ ! -d "$APPDIR/.git" ]]; then
  git clone --depth 1 "$GITURL" "$APPDIR"
else
  git -C "$APPDIR" pull --ff-only
fi
cd "$APPDIR/server"
npm install --omit=dev
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DBUSER'" | grep -qx 1; then
  DBPASS="$(openssl rand -hex 24)"
  sudo -u postgres psql -v ON_ERROR_STOP=1 -v passwd="$DBPASS" <<'SQL'
SELECT format('CREATE ROLE merge_defense_app LOGIN PASSWORD %L', :'passwd') \gexec
SQL
  umask 077
  printf 'DB_PASSWORD=%s\n' "$DBPASS" > "$APPDIR/.merge-db-password"
else
  if [[ ! -f "$APPDIR/.merge-db-password" ]]; then
    echo "The DB role already exists but its password file is missing. Stopping to avoid overwriting it."
    exit 1
  fi
  DBPASS="$(sed -n 's/^DB_PASSWORD=//p' "$APPDIR/.merge-db-password")"
fi
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DBNAME'" | grep -qx 1; then
  sudo -u postgres createdb -O "$DBUSER" "$DBNAME"
fi
sudo -u postgres psql -d "$DBNAME" -v ON_ERROR_STOP=1 -f "$APPDIR/server/schema.sql"
if [[ ! -f "$DBFILE" ]]; then
  umask 077
  cat > "$DBFILE" <<EOF
PORT=3005
CLIENT_ORIGIN=https://merge-defense.onrender.com
DATABASE_URL=postgresql://$DBUSER:$DBPASS@127.0.0.1:5432/$DBNAME
DB_SSL=disable
VK_APP_ID=
VK_APP_SECRET=
EOF
  chmod 600 "$DBFILE"
fi
cat > "$APPDIR/server/run.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd /opt/merge-defense/server
set -a
source ./.env
set +a
exec node index.js
EOF
chmod 750 "$APPDIR/server/run.sh"
if ! pm2 describe merge-defense-api >/dev/null 2>&1; then
  pm2 start "$APPDIR/server/run.sh" --name merge-defense-api --interpreter bash
else
  pm2 restart merge-defense-api --update-env
fi
echo "MERGE DEFENSE API listening internally on 127.0.0.1:3005 (process binds 0.0.0.0; firewall must restrict port)."
echo "Separate database: $DBNAME; database AutoEmpire untouched."
echo "NEXT: set VK_APP_ID and VK_APP_SECRET in $DBFILE, then pm2 restart merge-defense-api."
echo "NEXT: configure existing Caddy HTTPS reverse proxy for a unique game API hostname to 127.0.0.1:3005."
echo "Check: curl -sS http://127.0.0.1:3005/health"
