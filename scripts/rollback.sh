#!/usr/bin/env sh
# scripts/rollback.sh <env> — roll an environment back to its previous release.
# Swaps dist/<env>/previous back into dist/<env>/current (the rolled-back release is kept under
# dist/<env>/rolled-back) and re-checks it. Exits 1, saying so, when the environment has no
# previous release: a rollback with nothing to roll back to is not a success.
# The console runs this only as an environment's declared rollback command (rehearse_rollback,
# `sdlc rehearse-rollback <env> <CHG>`) or as the `rollback` runbook in bands.yaml (staging only).
set -eu
env_name="${1:?usage: scripts/rollback.sh <env>}"
root="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
target="$root/dist/$env_name"
if [ ! -d "$target/current" ]; then
  echo "rollback.sh: $env_name has no release (dist/$env_name/current is missing) — nothing to roll back"
  exit 1
fi
from="$(sed -n 's/^sha=//p' "$target/current/DEPLOYED")"
if [ ! -d "$target/previous" ]; then
  echo "rollback.sh: $env_name is running $from and has no previous release under dist/$env_name/previous — nothing to roll back to (deploy twice, or seed it: SDLC_SHA=<sha> sh scripts/deploy.sh $env_name)"
  exit 1
fi
to="$(sed -n 's/^sha=//p' "$target/previous/DEPLOYED")"
rm -rf "$target/rolled-back"
mv "$target/current" "$target/rolled-back"
mv "$target/previous" "$target/current"
node --check "$target/current/src/site.js"
printf 'rolledBackFrom=%s\nrolledBackAt=%s\nrollbackChange=%s\n' "$from" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${SDLC_CHANGE:-}" >> "$target/current/DEPLOYED"
echo "rollback.sh: $env_name rolled back from $from to $to — node --check src/site.js ok; the rolled-back release is kept at dist/$env_name/rolled-back"
cat "$target/current/DEPLOYED"
