#!/usr/bin/env bash
set -euo pipefail
REPO=/opt/merge-defense
LOCK=/tmp/casino-city-auto-deploy.lock
exec 9>"$LOCK"
flock -n 9 || exit 0
cd "$REPO"
[ "$(git branch --show-current)" = main ] || { echo "Skip: not main"; exit 0; }
# Never overwrite uncommitted local changes.
[ -z "$(git status --porcelain --untracked-files=no)" ] || { echo "Skip: local changes"; exit 0; }
git fetch --quiet origin main
CURRENT=$(git rev-parse HEAD)
NEXT=$(git rev-parse origin/main)
[ "$CURRENT" != "$NEXT" ] || exit 0
git merge-base --is-ancestor "$CURRENT" "$NEXT" || { echo "Skip: remote not fast-forward"; exit 0; }
# Validate the candidate server code before applying it.
git show "$NEXT:server/index.js" | node --check --input-type=module
git show "$NEXT:server/casino-ranking.cjs" | node --check --input-type=commonjs
CHANGED=$(git diff --name-only "$CURRENT" "$NEXT")
git merge --ff-only "$NEXT"
if printf '%s\n' "$CHANGED" | grep -Eq '^(server/|backend/)'; then
  pm2 restart merge-defense
  echo "$(date -Is): updated backend $CURRENT -> $NEXT"
else
  echo "$(date -Is): updated static files $CURRENT -> $NEXT"
fi
