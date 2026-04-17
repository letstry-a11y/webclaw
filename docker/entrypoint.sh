#!/bin/sh
set -e

mkdir -p /app/data /app/public/uploads

echo "[entrypoint] Applying database migrations..."
./node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma

if [ "${SEED_ON_STARTUP:-false}" = "true" ]; then
  echo "[entrypoint] Seeding database (SEED_ON_STARTUP=true)..."
  ./node_modules/.bin/tsx ./prisma/seed.ts || echo "[entrypoint] Seed skipped / failed (tsx may not be bundled in production)."
fi

echo "[entrypoint] Starting Next.js server on ${HOSTNAME:-0.0.0.0}:${PORT:-3000}"
exec "$@"
