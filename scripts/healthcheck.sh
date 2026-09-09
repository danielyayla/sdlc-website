#!/usr/bin/env sh
# scripts/healthcheck.sh <env> — is the release an environment is running healthy?
# Checks the DEPLOYED marker exists, that src/site.js parses, and that renderPage renders a page.
# Exit 0 = healthy; anything else prints why. Run by the console as an environment's healthcheck
# command after a successful deploy, and as the `healthcheck` runbook in bands.yaml.
set -eu
env_name="${1:?usage: scripts/healthcheck.sh <env>}"
root="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
current="$root/dist/$env_name/current"
if [ ! -f "$current/DEPLOYED" ]; then
  echo "healthcheck.sh: $env_name is not deployed (dist/$env_name/current/DEPLOYED is missing)"
  exit 1
fi
node --check "$current/src/site.js"
node --input-type=module -e '
const [file] = process.argv.slice(1);
const site = await import(file);
const html = site.renderPage({ title: "healthcheck", body: "<p>ok</p>" });
if (!html.includes("<title>healthcheck</title>") || !html.includes("<p>ok</p>")) { console.log("renderPage produced:", html); process.exit(1); }
console.log("healthcheck.sh: renderPage ok (" + html.length + " bytes)");
' -- "$current/src/site.js"
echo "healthcheck.sh: $env_name healthy — running $(sed -n 's/^sha=//p' "$current/DEPLOYED")"
