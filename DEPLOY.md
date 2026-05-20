# Deployment

Target: **Cloudflare Pages** at `goal-plinko.pages.dev`

## Prerequisites

```bash
npm install -g wrangler
wrangler login
```

## Deploy

```bash
# One-liner
bash scripts/deploy.sh

# Or manually
npm run build
npx wrangler pages deploy dist --project-name=goal-plinko
```

## Local preview

```bash
npm run build
npm run preview
```
