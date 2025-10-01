# Shipping Calculator MVP

Interactive shipping cost estimator with zone maps and tunable pricing parameters.

## Features

- 🗺️ **Interactive zone map** with MapLibre GL
- 💰 **Live pricing calculator** with detailed breakdown
- 🎛️ **Tunable pricing controls** (sliders for all parameters)
- 📊 **Batch CSV pricing** with error analysis
- 💾 **Save/load pricing presets**
- 🔗 **Share URLs** with embedded pricing state
- 📤 **Export** quotes and batch results

## Quick Start

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Demo Workflow

1. Open app → Map displays 12 US zones with color-coded multipliers
2. Click two zones → Form auto-fills origin/destination
3. Adjust dimensions/weight → Price updates instantly
4. Open left drawer → Drag sliders (fuel %, per-mile, etc.)
5. Watch price & heatmap change in real-time
6. Upload CSV in Batch tab → Bulk price shipments
7. Settings → Copy share link with current pricing state

## Tech Stack

- **Frontend:** Vue 3 (Composition API), TypeScript
- **UI:** Vuetify 3, Material Design Icons
- **State:** Pinia
- **Maps:** MapLibre GL JS
- **CSV:** PapaParse
- **Build:** Vite

## Project Structure

```
src/
├── components/       # Vue components
│   ├── ZoneMap.vue
│   ├── EstimatorForm.vue
│   ├── PriceBreakdown.vue
│   ├── PricingControls.vue
│   └── PresetsPanel.vue
├── views/            # Route views
│   ├── EstimatorView.vue
│   ├── ZonesView.vue
│   ├── BatchView.vue
│   └── SettingsView.vue
├── stores/           # Pinia stores
│   ├── useZonesStore.ts
│   ├── usePricingStore.ts
│   └── useQuotesStore.ts
├── types/            # TypeScript types
├── utils/            # Utilities
└── router/           # Vue Router
public/data/          # Mock data
├── zones.geojson     # 12 US zones
├── presets.json      # Pricing presets
└── matrix.json       # Distance matrix
```

## Pricing Formula

```
DIM weight = (L × W × H) / dim_divisor
Billable weight = max(actual_weight, DIM_weight)
Variable cost = per_mile × miles + per_lb × billable_weight
Subtotal = (base_rate + variable_cost) × zone_factor × service_factor
Surcharges = fuel% + peak% + fixed_fees
Total = subtotal + surcharges + insurance
```

## CSV Format (Batch Upload)

Required columns:
```
origin_zone, dest_zone, length_in, width_in, height_in, weight_lb, service
```

Optional:
```
declared_value, residential, true_price
```

Returns with added columns:
```
quote_price, diff_abs, diff_pct
```

## Deployment

### GitHub Pages (Pre-configured)

This project is configured to build into the `docs/` folder for GitHub Pages:

```bash
npm run build
git add docs/
git commit -m "Deploy to GitHub Pages"
git push
```

Then in GitHub repo settings:
1. Go to **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** → **/docs** → Save

Your app will be live at: `https://YOUR-USERNAME.github.io/shipping-calculator/`

### Other Hosting Options

Deploy to Netlify, Vercel, etc.:

```bash
npm run build
# Upload docs/ folder to your provider
```

## License

MIT
