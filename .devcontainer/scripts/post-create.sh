#!/usr/bin/env bash
# Runs once after the devcontainer is created (postCreateCommand).
set -euo pipefail

WORKSPACE=/workspace
cd "$WORKSPACE"

echo "==> Restoring .NET packages"
dotnet restore Nebula.API/Nebula.API.csproj

echo "==> Installing web dependencies"
# npm ci needs the lockfile to match package.json; fall back to install if a
# branch has them out of sync rather than failing container creation outright.
cd "$WORKSPACE/Nebula.Web"
npm ci || npm install
cd "$WORKSPACE"

echo "==> Seeding appsecrets.json if absent"
if [ ! -f Nebula.API/appsecrets.json ]; then
  cp Nebula.API/appsecrets.template.json Nebula.API/appsecrets.json
  echo "    created Nebula.API/appsecrets.json from the template (gitignored)"
else
  echo "    already present, left alone"
fi

# The submodule holds EFCorePOCOGenerator. It is only usable from Windows (see
# below), but initialising it keeps the tree consistent and the checkout cheap.
echo "==> Initialising submodules"
git submodule update --init --recursive || echo "    (skipped: no network or not a git checkout)"

cat <<'EOF'

============================================================================
Nebula devcontainer ready.

  make start      API + web dev server
  make api        API only        (http://localhost:12160)
  make web        Angular only    (http://localhost:12162)
  make auth       one-time az + gh sign-in (shared across worktrees)
  make help       everything else

GeoServer runs at http://localhost:12168/geoserver (admin/geomaster).

TWO THINGS THIS CONTAINER CANNOT DO:

1. Code generation. Build/Scaffold.ps1 needs the Scaffold-DbContext
   PowerShell cmdlet and a Windows EFCorePOCOGenerator.exe, so it must be run
   from Windows. `make scaffold` will tell you this rather than fail oddly.
   Note also that Nebula.Models/DataTransferObjects/EntityDtos is now
   hand-maintained -- the generator no longer emits C# DTOs at all.

2. The three analysis pages (time-series, paired-regression,
   diversion-scenario) call the external Lyra service for every chart. There
   is no local Lyra; they need network access to WEB_LYRA_BASE_URL. The rest
   of the app -- users, CMS, watershed map -- works fully offline.
============================================================================
EOF
