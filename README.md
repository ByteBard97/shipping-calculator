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

---

## Amazon Seller Portal - Setup for Joseph

### Quick Start (Windows)

#### One-Time Setup

1. **Install Node.js** (if you haven't already):
   - Download from: https://nodejs.org/
   - Get the LTS version (Long Term Support)
   - Install with default options

2. **Install Dependencies**:
   - Open this folder in File Explorer
   - Right-click in an empty space → "Open in Terminal" (or use Command Prompt)
   - Run: `npm install`
   - Wait for it to finish (this downloads all the code libraries needed)

3. **Add Your Amazon Credentials**:
   - Create a new file in this folder called `.credentials`
   - Paste this into it:
   ```json
   {
     "clientId": "your-amazon-client-id-here",
     "clientSecret": "your-amazon-client-secret-here",
     "refreshToken": "your-amazon-refresh-token-here"
   }
   ```
   - Replace the placeholder values with your actual Amazon SP-API credentials
   - Save the file
   - **Important**: This file stays on YOUR computer only - it's never uploaded anywhere

#### Running the App

You have TWO options:

**Option 1: Browser Mode (Easier)**
- Double-click `start.bat`
- Opens in your web browser
- Works immediately

**Option 2: Desktop App Mode (More Professional)**
- Double-click `start-desktop.bat`
- Opens as a standalone Windows application (not in browser)
- Looks like a real desktop program
- First time will take 1-2 minutes to compile (Rust needs to build)
- After that, starts instantly

Both modes do the same thing - pick whichever you prefer!

#### Stopping the App

- **Browser Mode**: Close the command prompt window, or press Ctrl+C
- **Desktop Mode**: Just close the app window like any other program

### What You Can Do

- **Products Tab**:
  - **Sync from Amazon**: Click the "Sync from Amazon" button to pull in your existing products
  - If you have a `.credentials` file, it will fetch your real Amazon listings
  - Without credentials, it uses mock data for testing
  - Manage your product listings, prices, and inventory

- **Analytics & Tools Tab**: This is where the magic happens!
  - **Profit Margin Calculator**: See exactly what you make after all Amazon fees
  - **Competitor Price Tracker**: Compare your prices to competitors (mock data for now)
  - **Seasonal Pricing**: Get pricing recommendations by season
  - **Bundle Creator**: Create product bundles with automatic pricing
  - **Inventory Forecast**: Know exactly when to reorder based on sales velocity

### Syncing Your Real Amazon Products

The app can pull in your existing Amazon listings!

**Without Credentials (Works Now)**:
- App uses mock data automatically
- All features work for testing
- No setup required

**With Real Amazon Data**:
1. Get Amazon SP-API credentials (see `AMAZON_SYNC_SETUP.md` for detailed guide)
2. Create a `.credentials` file (copy from `.credentials.example`)
3. Fill in your Client ID, Client Secret, and Refresh Token
4. Click "Sync from Amazon" button in the Products tab
5. Your real products load automatically!

**What Gets Synced**:
- ✅ Product SKUs, Titles, Brands
- ✅ Prices and Inventory quantities
- ✅ ASINs and Product images
- ✅ Active/Inactive status

**Sandbox vs Production**:
- Start with `"mode": "sandbox"` (safe testing, won't affect real listings)
- Switch to `"mode": "production"` when ready (be careful!)

### Your Credentials Are Safe

- The `.credentials` file only exists on YOUR computer
- It's in the `.gitignore` file (Git ignores it)
- It will NEVER be uploaded to GitHub or anywhere else
- Only you can access it

### Need Help?

If something doesn't work:
1. Make sure you ran `npm install` first
2. Check that Node.js is installed (`node --version` in terminal)
3. Verify your `.credentials` file is in the right place and has valid JSON
4. Make sure port 5173 isn't already in use

### Making It Even Easier (Optional)

**Create a Desktop Shortcut:**
1. Right-click `start.bat`
2. Click "Create shortcut"
3. Drag the shortcut to your Desktop
4. Now you can launch it from your Desktop like any other app!

**Bonus**: You can even change the shortcut's icon:
1. Right-click the shortcut → Properties
2. Click "Change Icon"
3. Pick something that looks like a business/Amazon icon

---

## License

MIT
