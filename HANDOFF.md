# Project Handoff - Amazon Seller Portal & Shipping Calculator

## Current State (Oct 2, 2025)

This is a **dual-purpose application**:
1. **Shipping Calculator** - Interactive zone-based shipping cost estimator (original)
2. **Amazon Seller Portal** - Product management tool for Joseph's Guinea Pig Hay business (new)

### What Works Right Now

#### ✅ Shipping Calculator (Complete)
- Interactive zone map with MapLibre GL
- Live pricing calculator with tunable parameters
- Batch CSV pricing
- Save/load presets
- Deployed to GitHub Pages: https://bytebard97.github.io/shipping-calculator/

#### ✅ Amazon Seller Portal (Prototype + Real Integration)
- **5 Analytics Tools** (all working):
  1. **Profit Margin Calculator** - Amazon fees, FBA costs, ROI calculations
  2. **Competitor Price Tracker** - Market position analysis (mock data)
  3. **Seasonal Pricing Suggestions** - Holiday/seasonal pricing recommendations
  4. **Bundle Product Creator** - Visual bundle builder with auto-pricing
  5. **Inventory Forecast Calculator** - Reorder predictions based on sales velocity

- **Amazon SP-API Integration** (ready to use):
  - OAuth token refresh logic (`src/services/amazonApi.ts`)
  - Product sync from Amazon Listings API
  - Sandbox and Production mode support
  - Graceful fallback to mock data if no credentials

- **Dual Mode Deployment**:
  - **Browser Mode**: `npm run dev` or `start.bat` (opens in browser)
  - **Desktop Mode**: `npm run dev:desktop` or `start-desktop.bat` (Tauri standalone app)

### Architecture Overview

```
shipping-calculator/
├── src/
│   ├── components/          # Reusable Vue components
│   │   ├── ProfitMarginCalculator.vue
│   │   ├── CompetitorPriceTracker.vue
│   │   ├── SeasonalPricingSuggestions.vue
│   │   ├── BundleProductCreator.vue
│   │   └── InventoryForecastCalculator.vue
│   ├── services/
│   │   └── amazonApi.ts     # Amazon SP-API integration
│   ├── views/
│   │   ├── AmazonSellerView.vue     # Main Amazon portal
│   │   ├── AmazonFlowDemoView.vue   # How it works (with Mermaid diagrams)
│   │   └── [shipping views...]
│   └── stores/              # Pinia state management
├── src-tauri/               # Tauri desktop app config
│   ├── tauri.conf.json
│   ├── Cargo.toml
│   └── src/main.rs
├── docs/                    # Built files for GitHub Pages
├── .credentials.example     # Template for Amazon credentials
├── start.bat                # Browser mode launcher (Windows)
└── start-desktop.bat        # Desktop app launcher (Windows)
```

### Tech Stack

**Frontend:**
- Vue 3 (Composition API) + TypeScript
- Vuetify 3 (Material Design)
- Pinia (state management)
- MapLibre GL (maps)
- Mermaid (flowchart diagrams)
- Vite (build tool)

**Desktop (Optional):**
- Tauri 2.x (Rust-based, ~3MB vs Electron's 100MB+)

**APIs:**
- Amazon SP-API (Selling Partner API)
- OAuth 2.0 with LWA (Login with Amazon)

### Key Features & How They Work

#### 1. Amazon Product Sync
**File**: `src/services/amazonApi.ts`

```typescript
// Automatically loads .credentials file (if exists)
await amazonApi.loadCredentials()

// Refreshes OAuth token (1-hour expiry)
const token = await amazonApi.getAccessToken()

// Fetches products from Amazon Listings API
const result = await amazonApi.syncProducts()
// Returns: { success, count, products[] }
```

**User Flow:**
1. Joseph creates `.credentials` file (from `.credentials.example`)
2. Clicks "Sync from Amazon" button in Products tab
3. App fetches real products or falls back to mock data
4. Products populate in the table

**Credentials Format:**
```json
{
  "clientId": "amzn1.application-oa2-client.xxx",
  "clientSecret": "secret_xxx",
  "refreshToken": "Atzr|token_xxx",
  "mode": "sandbox",  // or "production"
  "region": "us-east-1",
  "marketplaceId": "ATVPDKIKX0DER"  // USA
}
```

#### 2. Analytics Tools (All in AmazonSellerView "Analytics & Tools" tab)

Each is a standalone Vue component with:
- Interactive inputs
- Real-time calculations
- Visual feedback (charts, progress bars, color coding)
- Expansion panels for organization

**Profit Margin Calculator:**
- Inputs: selling price, COGS, shipping, category, fulfillment method
- Outputs: Net profit, margin %, ROI, fee breakdown
- Recommendations based on 30%/15% margin thresholds

**Competitor Price Tracker:**
- Mock competitor data (Amazon API doesn't provide this)
- Real-time market position
- Price comparison suggestions

**Seasonal Pricing:**
- Timeline of seasons (Winter → Spring → Summer → Fall → Holiday)
- Price multipliers per season
- Demand forecasting
- Upcoming opportunities calendar

**Bundle Creator:**
- Drag products from available list
- Adjust quantities
- Auto-calculate bundle price with discount
- Title suggestions based on bundle contents
- Marketing highlights

**Inventory Forecast:**
- Current stock, daily sales avg, lead time, safety stock
- Reorder point calculations
- 8-week forecast visualization
- Stockout risk assessment
- Seasonal demand predictions

#### 3. Dual Deployment (Browser vs Desktop)

**Browser Mode** (default):
```bash
npm run dev          # Development
npm run build        # Production (outputs to docs/)
start.bat            # Launcher for Joseph (Windows)
```
- Opens in browser at localhost:5173
- Works with Vite dev server
- Good for testing, web deployment

**Desktop Mode** (Tauri):
```bash
npm run dev:desktop      # Development (opens native window)
npm run build:desktop    # Creates .exe installer
start-desktop.bat        # Launcher for Joseph (Windows)
```
- Native Windows application
- No browser UI (own window)
- Smaller footprint than Electron
- First run takes 1-2 min to compile Rust (then instant)

### GitHub Pages Deployment

**Current Setup:**
- Builds to `docs/` folder
- GitHub Pages serves from `docs/` on master branch
- Base path: `/shipping-calculator/`

**Critical Fix Applied:**
- Added `docs/.nojekyll` file
- **Why**: GitHub Pages runs Jekyll by default, which ignores files starting with `_`
- Mermaid's dynamic imports created `_baseUniq-*.js`, `_basePickBy-*.js` files
- Jekyll blocked them → 404 errors
- `.nojekyll` disables Jekyll → files served correctly

**Vite Config:**
```javascript
export default defineConfig({
  base: '/shipping-calculator/',
  build: {
    outDir: 'docs',
    rollupOptions: {
      output: {
        manualChunks: {
          'mermaid': ['mermaid']
        }
      }
    }
  }
})
```

### For Joseph (The End User)

**Joseph is a guinea pig hay seller** who needs:
1. ✅ Manage Amazon product listings efficiently
2. ✅ Calculate profit margins after Amazon fees
3. ✅ Track competitor prices (manually for now)
4. ✅ Optimize seasonal pricing
5. ✅ Create product bundles
6. ✅ Forecast inventory reorders

**His Setup:**
1. Install Node.js
2. Run `npm install`
3. (Optional) Create `.credentials` file with Amazon SP-API keys
4. Double-click `start.bat` (browser) or `start-desktop.bat` (desktop app)

**Why Local-Only (No Backend Server)?**
- Joseph is a single user
- Credentials stay on his computer (secure)
- No hosting costs
- No deployment complexity
- He just runs `npm run dev` when he needs it

**Can Use Real Amazon Data:**
- Get SP-API credentials from Amazon Developer Console
- Create `.credentials` file
- Click "Sync from Amazon" button
- Real products load automatically

### What's NOT Implemented (Future Work)

#### Amazon API - Partial Implementation
- ✅ Product fetching (Listings API)
- ✅ OAuth token refresh
- ❌ Product creation/updates (write operations)
- ❌ Order management
- ❌ Advertising API

#### Data Sources
- ❌ Real competitor prices (Amazon doesn't provide; need Keepa/Jungle Scout API)
- ❌ Historical sales data (different SP-API endpoint)
- ❌ Reviews/ratings (Reports API)

#### Features
- ❌ CSV export of analytics
- ❌ Automated price adjustments
- ❌ Email/SMS alerts for reorder points
- ❌ Multi-user support
- ❌ Cloud sync

### Known Issues & Gotchas

1. **GitHub Pages 404s on Dynamic Imports**
   - **Solution**: Ensure `docs/.nojekyll` exists
   - Files starting with `_` won't load without this

2. **OAuth Refresh Token Expiry**
   - Refresh tokens don't expire... unless they do (Amazon can revoke)
   - User needs to re-authorize if token becomes invalid
   - Error handling shows "Token refresh failed" message

3. **CORS Issues with Amazon API**
   - **In dev mode**: Vite proxy could handle this (not configured yet)
   - **In production web**: Would need backend proxy
   - **In desktop mode**: Tauri can make direct requests (no CORS)
   - **Current approach**: Relies on dev server being able to call Amazon directly (may need proxy configuration)

4. **First Tauri Build is Slow**
   - Rust compilation takes 1-2 minutes first time
   - Subsequent builds are fast
   - This is normal Tauri behavior

5. **Credentials File Location**
   - Must be in project root (same folder as `package.json`)
   - Filename is `.credentials` (with dot, no extension)
   - Windows users might accidentally name it `.credentials.txt`

### How to Continue Development

#### To Add More Analytics Tools:
1. Create new component in `src/components/`
2. Import in `AmazonSellerView.vue`
3. Add to expansion panels in Analytics tab
4. Follow existing component patterns (props, reactive data, computed values)

#### To Add Amazon Write Operations:
1. Extend `src/services/amazonApi.ts`
2. Add methods like `createProduct()`, `updatePrice()`, `updateInventory()`
3. Use same token refresh logic
4. Call appropriate SP-API endpoints (e.g., `/listings/2021-08-01/items/{sku}`)

#### To Add Backend (If Needed Later):
1. Create Express/Fastify server in `server/`
2. Move `.credentials` to server (environment variables)
3. Proxy Amazon API calls through server
4. Frontend calls server instead of Amazon directly
5. Solves CORS, keeps credentials server-side

#### To Fix Competitor Pricing:
1. Sign up for Keepa or Jungle Scout API
2. Add new service `src/services/keepaApi.ts`
3. Fetch competitor data from their API
4. Update `CompetitorPriceTracker.vue` with real data

### Testing

**Without Credentials:**
```bash
npm run dev
# Navigate to /amazon-seller
# Click "Sync from Amazon"
# Should show "No credentials found" message
# Should display mock products
```

**With Credentials:**
1. Copy `.credentials.example` to `.credentials`
2. Fill in real Amazon SP-API credentials
3. Set `"mode": "sandbox"`
4. `npm run dev`
5. Click "Sync from Amazon"
6. Should fetch products from Amazon Sandbox

**Desktop App:**
```bash
npm run dev:desktop
# First time: wait 1-2 min for Rust compile
# Should open native window
# All features work same as browser mode
```

**Build for Production:**
```bash
npm run build                # Web build → docs/
npm run build:desktop        # Desktop installer → src-tauri/target/release/bundle/
```

### Important Files to Know

**Configuration:**
- `vite.config.ts` - Build config, base path, manual chunks
- `src-tauri/tauri.conf.json` - Desktop app config
- `.gitignore` - Includes `.credentials` to prevent commits

**Entry Points:**
- `src/main.ts` - Vue app initialization
- `src/router/index.ts` - Route definitions
- `src-tauri/src/main.rs` - Tauri desktop app entry

**State Management:**
- `src/stores/` - Pinia stores for shared state
- Currently: pricing, zones, quotes
- Could add: amazon products, sync status

**API Integration:**
- `src/services/amazonApi.ts` - THE file for Amazon SP-API

**Documentation:**
- `README.md` - Main user guide (for Joseph)
- `AMAZON_SYNC_SETUP.md` - Detailed credential setup
- `.credentials.example` - Template with all fields

### Environment & Dependencies

**Node Version:** Any recent LTS (18+)

**Key Dependencies:**
- `vue@^3.5` - Framework
- `vuetify@^3.7` - UI components
- `@tauri-apps/cli@^2.8` - Desktop app CLI
- `@tauri-apps/api@^2.8` - Desktop app API
- `mermaid@^11.12` - Flowchart diagrams
- `maplibre-gl@^4.7` - Maps
- `pinia@^2.3` - State
- `vue-router@^4.5` - Routing

**Build Output Size:**
- Web: ~1.4 MB main bundle (gzipped: 416 KB)
- Desktop: ~3-5 MB installer (Tauri)

### Contact Points / External Integrations

**Amazon SP-API:**
- Docs: https://developer-docs.amazon.com/sp-api/
- Token endpoint: `https://api.amazon.com/auth/o2/token`
- Listings endpoint: `https://sellingpartnerapi-na.amazon.com/listings/2021-08-01/items`

**GitHub Pages:**
- URL: https://bytebard97.github.io/shipping-calculator/
- Source: `docs/` folder on master branch
- Deployed via GitHub Actions (automatic on push)

### Questions for Next Session

1. **Does Joseph actually need desktop mode?** Or is browser fine?
2. **Should we add a backend?** (For CORS, security, scheduled tasks)
3. **What about competitor pricing?** (Need paid API like Keepa)
4. **Export functionality?** (CSV, Excel, PDF reports)
5. **Multi-marketplace support?** (Canada, Mexico, Europe)
6. **Automated repricing?** (Based on competitor prices)

### Quick Commands Reference

```bash
# Development
npm run dev                    # Browser mode (localhost:5173)
npm run dev:desktop            # Desktop app mode

# Building
npm run build                  # Web → docs/
npm run build:desktop          # Desktop → installer

# Launching (for Joseph)
start.bat                      # Browser mode (Windows)
start-desktop.bat              # Desktop mode (Windows)

# Common Tasks
npm install                    # Install dependencies
git status                     # Check git status
git push                       # Deploy to GitHub Pages
```

### Last Known Good State

- ✅ All 5 analytics tools working
- ✅ Amazon sync button functional
- ✅ Tauri desktop mode configured
- ✅ GitHub Pages deployment working (with `.nojekyll` fix)
- ✅ Mock data fallback operational
- ✅ Build succeeding with no errors
- ✅ README and docs updated

**Latest Commit:** Should include all Amazon sync features + Tauri setup

**Next Steps:** Test with real Amazon credentials, or continue building features with mock data.

---

*Last Updated: October 2, 2025*
*Status: Feature-complete prototype, ready for Joseph to test*
