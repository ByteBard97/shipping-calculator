# Demo Script

## Quick Start

```bash
npm run dev
```

Open http://localhost:5173

## Demo Flow (5 minutes)

### 1. Map & Zone Selection (1 min)
- **Map displays** 12 color-coded US zones
- **Click Zone 1** (Northeast 1) → origin chip appears
- **Click Zone 2** (West 1) → destination chip appears
- Form auto-populates with zone IDs

### 2. Live Pricing (1 min)
- Adjust **dimensions** (12×10×8 in) → price updates instantly
- Change **weight** to 15 lb → watch billable weight recalculate
- Toggle **service level** to "Expedited" → 35% multiplier applied
- Price breakdown expands to show all line items

### 3. Pricing Controls (1.5 min)
- **Left drawer** → Pricing Controls
- Drag **Fuel Surcharge** slider from 12% → 20%
- Watch price update in real-time
- Drag **Per Mile** from $0.25 → $0.35
- Map heatmap colors shift instantly
- Try **Peak Season** slider → adds 8% surcharge

### 4. Presets (30 sec)
- **Right drawer** → Presets Panel
- Click **"Peak Season"** preset
- All sliders jump to new values
- Save custom preset with "My Test v1"
- Export preset as JSON

### 5. Batch Pricing (1 min)
- Navigate to **Batch** tab
- Upload `/sample-shipments.csv` (provided in public/ folder)
- 10 shipments priced instantly
- Summary shows:
  - Total shipments: 10
  - Average price: ~$75
  - Average error: ~8% (vs true_price column)
- Export results CSV

### 6. Share Link (1 min)
- Navigate to **Settings**
- Copy share URL (includes all current pricing params)
- Open in incognito/new tab → same sliders load
- Toggle dark mode for bonus points

## Key Selling Points

✅ **Speed:** <200ms recalculation on any change
✅ **Transparency:** Full breakdown of every charge
✅ **Tunable:** 10+ pricing levers with live feedback
✅ **Visual:** Heatmap shows pricing zones at a glance
✅ **Batch-ready:** CSV upload → instant bulk pricing
✅ **Shareable:** URL encodes entire pricing state

## Files Structure

```
public/
├── data/
│   ├── zones.geojson          ← 12 US zones
│   ├── presets.json           ← 2 pricing presets
│   └── matrix.json            ← Distance matrix
└── sample-shipments.csv       ← Test data with true prices

src/
├── components/                ← Reusable UI
├── views/                     ← 4 main screens
├── stores/                    ← Pinia state (zones, pricing, quotes)
└── types/                     ← TypeScript interfaces
```

## Next Steps (Stretch)

- Add authentication & role-based presets
- Multi-carrier zone systems (tabs)
- A/B test two presets side-by-side
- Rate card generator (table export)
- Time-of-day multipliers
- PDF quote export

## Tech Stack Highlights

- **Vue 3** Composition API + TypeScript
- **Vuetify 3** Material Design
- **Pinia** for reactive state
- **MapLibre GL** for fast vector maps
- **PapaParse** for CSV handling
- **Vite** for instant HMR

---

**Built in ~2 hours with LLM-assisted coding**
