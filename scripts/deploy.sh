#!/usr/bin/env bash
set -euo pipefail

echo "==> Building..."
npm run build

echo "==> Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=goal-plinko

echo "==> Done! Live at https://goal-plinko.pages.dev"
