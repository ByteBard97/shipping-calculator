# Bug Fixes Applied

## Issue: 404 Errors on GitHub Pages

**Problem:** Data files (zones.geojson, presets.json, matrix.json) were not loading because fetch calls used absolute paths (`/data/...`) instead of relative to the base URL.

**Solution:** Updated all fetch calls to use `import.meta.env.BASE_URL`:

### Files Changed

1. **src/stores/useZonesStore.ts**
   - Changed: `fetch('/data/zones.geojson')`
   - To: `fetch(\`\${import.meta.env.BASE_URL}data/zones.geojson\`)`
   - Same for `matrix.json`

2. **src/stores/usePricingStore.ts**
   - Changed: `fetch('/data/presets.json')`
   - To: `fetch(\`\${import.meta.env.BASE_URL}data/presets.json\`)`

3. **public/vite.svg**
   - Added favicon to prevent 404 error

### How It Works

- **Local dev:** `BASE_URL = '/'` → fetches from `/data/zones.geojson`
- **GitHub Pages:** `BASE_URL = '/shipping-calculator/'` → fetches from `/shipping-calculator/data/zones.geojson`

### Verification

✅ Build completes without errors
✅ Preview server serves files correctly at `/shipping-calculator/`
✅ Data files accessible via curl test
✅ All paths now use the configured base URL

## Testing Locally

```bash
npm run build
npm run preview
```

Visit: http://localhost:4173/shipping-calculator/

Should load without any 404 errors in console.

## Deploy to GitHub Pages

```bash
git add .
git commit -m "Fix data loading paths for GitHub Pages"
git push
```

The app will now work correctly on GitHub Pages!
