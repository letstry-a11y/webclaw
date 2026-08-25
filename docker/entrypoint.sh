#!/bin/sh
set -e

mkdir -p /app/data /app/public/uploads

echo "[entrypoint] Syncing database schema..."
node ./node_modules/prisma/build/index.js db push --schema=./prisma/schema.prisma

if [ "${SEED_ON_STARTUP:-false}" = "true" ]; then
  echo "[entrypoint] Seeding database (SEED_ON_STARTUP=true)..."
  node ./node_modules/.bin/tsx ./prisma/seed.ts || echo "[entrypoint] Seed skipped / failed."
fi

echo "[entrypoint] Starting Next.js server on ${HOSTNAME:-0.0.0.0}:${PORT:-3000}"
exec "$@"
