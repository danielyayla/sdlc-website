#!/usr/bin/env sh
# scripts/deploy.sh <env> — "deploy" the SDLC website to an environment.
# Builds the commit in $SDLC_SHA (default HEAD) into dist/<env>/current at the repository root
# (found through the common git dir, so a session worktree and the checkout share one release
# directory) and keeps the release it replaces under dist/<env>/previous for scripts/rollback.sh.
# Nothing is published anywhere: the release directory and its DEPLOYED marker are the deployment.
# The console runs this only as the command sdlc/config.yaml environments[] declares
# (the deploy_<env> tool, `sdlc deploy <env> <CHG>`), with SDLC_CHANGE/SDLC_ENV/SDLC_ENV_KIND/SDLC_SHA set.
set -eu
env_name="${1:?usage: scripts/deploy.sh <env>}"
root="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
sha="$(git rev-parse "${SDLC_SHA:-HEAD}")"
target="$root/dist/$env_name"
incoming="$target/incoming"
rm -rf "$incoming"
mkdir -p "$incoming"
git archive "$sha" src package.json | tar -x -C "$incoming"
node --check "$incoming/src/site.js"
echo "deploy.sh: built $sha (src/, package.json) for $env_name — node --check src/site.js ok"
if [ -d "$target/current" ]; then
  rm -rf "$target/previous"
  mv "$target/current" "$target/previous"
  echo "deploy.sh: previous release $(sed -n 's/^sha=//p' "$target/previous/DEPLOYED") kept at dist/$env_name/previous"
else
  echo "deploy.sh: first release of $env_name — there is no previous release to roll back to yet"
fi
mv "$incoming" "$target/current"
printf 'env=%s\nkind=%s\nsha=%s\nchange=%s\ndeployedAt=%s\n' "$env_name" "${SDLC_ENV_KIND:-}" "$sha" "${SDLC_CHANGE:-}" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$target/current/DEPLOYED"
echo "deploy.sh: $env_name is now running $sha at dist/$env_name/current"
cat "$target/current/DEPLOYED"
