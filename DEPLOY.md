# Deployment Guide

## Option 1: Netlify (Recommended)

### One-Click Deploy

1. Push to GitHub
2. Go to [netlify.com](https://netlify.com)
3. "New site from Git" → select repo
4. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Deploy!

### Netlify CLI

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

## Option 2: Vercel

```bash
npm install -g vercel
vercel
# Follow prompts
```

Or via [vercel.com](https://vercel.com):
1. Import GitHub repo
2. Framework preset: **Vite**
3. Deploy

## Option 3: GitHub Pages

1. Install gh-pages:
```bash
npm install -D gh-pages
```

2. Add to `package.json`:
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. Update `vite.config.ts`:
```ts
export default defineConfig({
  base: '/shipping-calculator/',  // your repo name
  // ... rest of config
})
```

4. Deploy:
```bash
npm run deploy
```

## Option 4: Static Hosting (any provider)

Build and upload `dist/` folder to:
- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Static Web Apps
- Cloudflare Pages
- Firebase Hosting

```bash
npm run build
# Upload dist/ contents to your provider
```

## Environment Variables (Optional)

If you add a backend API, create `.env`:

```
VITE_API_URL=https://api.example.com
```

Access via `import.meta.env.VITE_API_URL`

## Performance Tips

### Code Splitting

Already implemented via `lazy()` routes in `src/router/index.ts`

### Bundle Analysis

```bash
npm install -D rollup-plugin-visualizer
```

Add to `vite.config.ts`:
```ts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    visualizer()
  ]
})
```

### CDN for Large Assets

Consider serving MapLibre CSS from CDN (already done in `index.html`)

## Domain Setup

### Custom Domain (Netlify/Vercel)

1. Go to Domain Settings
2. Add custom domain
3. Update DNS:
   - **A record:** points to provider IP
   - **CNAME:** `www` → `your-app.netlify.app`

### SSL

All platforms provide free SSL via Let's Encrypt automatically.

## Monitoring

- **Netlify Analytics:** Built-in (paid)
- **Google Analytics:** Add to `index.html`
- **Sentry:** For error tracking

```html
<!-- Add to index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

## CI/CD

Already works out of the box with:
- GitHub → Netlify (auto-deploy on push)
- GitHub → Vercel (auto-deploy on push)

For custom CI:
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: netlify deploy --prod --dir=dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_TOKEN }}
```

## Live URL Examples

- **Netlify:** `shipping-calculator.netlify.app`
- **Vercel:** `shipping-calculator.vercel.app`
- **Custom:** `pricing.yourcompany.com`

---

**Estimated deploy time:** 3-5 minutes
