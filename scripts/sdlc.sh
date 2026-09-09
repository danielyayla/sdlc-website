#!/usr/bin/env sh
# scripts/sdlc.sh <sdlc args> — run the SDLC console CLI for this repository, in CI and by hand.
# The console is not on npm, so the generated workflows call this instead of `npx sdlc`
# (`sdlc init --sdlc-bin "sh scripts/sdlc.sh"`). Resolution order:
#   1. $SDLC_BIN — a built packages/cli/dist/bin.js (a local checkout of danielyayla/sdlc-console);
#   2. .sdlc-state/console/ — a build this script made earlier (gitignored cache);
#   3. otherwise clone https://github.com/danielyayla/sdlc-console at $SDLC_CONSOLE_REF (default main)
#      into .sdlc-state/console and build it (pnpm install + tsc -b, no web bundle; ~2 min in CI).
set -eu
root="$(cd "$(dirname "$0")/.." && pwd)"
if [ -n "${SDLC_BIN:-}" ]; then
  exec node "$SDLC_BIN" "$@"
fi
dir="$root/.sdlc-state/console"
bin="$dir/packages/cli/dist/bin.js"
if [ ! -f "$bin" ]; then
  ref="${SDLC_CONSOLE_REF:-main}"
  echo "sdlc.sh: building the console from https://github.com/danielyayla/sdlc-console@$ref into .sdlc-state/console" >&2
  rm -rf "$dir"
  git clone --quiet --depth 1 --branch "$ref" https://github.com/danielyayla/sdlc-console "$dir"
  export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
  corepack enable >/dev/null 2>&1 || true
  (cd "$dir" && pnpm install --frozen-lockfile --reporter=silent && pnpm exec tsc -b)
  echo "sdlc.sh: console built at $(git -C "$dir" rev-parse --short HEAD)" >&2
fi
exec node "$bin" "$@"
