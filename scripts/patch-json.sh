#!/usr/bin/env bash
# Bumps package.json's version field. Prints the new version on stdout.
#
# Usage:
#   scripts/patch-json.sh              # patch bump (0.1.0 -> 0.1.1)
#   scripts/patch-json.sh minor        # minor bump (0.1.0 -> 0.2.0)
#   scripts/patch-json.sh major        # major bump (0.1.0 -> 1.0.0)
#   scripts/patch-json.sh 1.2.0        # set explicit version
set -euo pipefail

FILE="${PKG_JSON:-package.json}"
ARG="${1:-patch}"

CURRENT=$(bun -e "
  import { readFileSync } from 'fs';
  process.stdout.write(JSON.parse(readFileSync('$FILE', 'utf8')).version);
")

if [[ "$ARG" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  NEW="$ARG"
elif [[ "$ARG" =~ ^(major|minor|patch)$ ]]; then
  IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"
  case "$ARG" in
    major) MAJOR=$((MAJOR+1)); MINOR=0; PATCH=0 ;;
    minor) MINOR=$((MINOR+1)); PATCH=0 ;;
    patch) PATCH=$((PATCH+1)) ;;
  esac
  NEW="$MAJOR.$MINOR.$PATCH"
else
  echo "✗ Unknown argument: $ARG (expected major/minor/patch or an explicit x.y.z)" >&2
  exit 1
fi

bun -e "
  import { readFileSync, writeFileSync } from 'fs';
  const pkg = JSON.parse(readFileSync('$FILE', 'utf8'));
  pkg.version = '$NEW';
  writeFileSync('$FILE', JSON.stringify(pkg, null, 2) + '\n');
"

echo "$NEW"
