# ⚡ Quick Start

## 🎯 You Have Everything You Need

✅ Full MVP built and ready
✅ Production build in `docs/` folder
✅ Configured for GitHub Pages

## 🚀 Three Steps to Deploy

### 1. Install Dependencies (First Time Only)

```bash
npm install
```

### 2. Test Locally

```bash
npm run dev
```

Open http://localhost:5173 and play with the app!

### 3. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - Shipping Calculator MVP"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/shipping-calculator.git
git push -u origin main
```

Then enable GitHub Pages:
- Repo **Settings** → **Pages**
- Source: **main** branch, **/docs** folder
- Save

Done! Your app will be live at:
`https://YOUR-USERNAME.github.io/shipping-calculator/`

## 📖 Learn More

- **DEMO.md** - 5-minute demo script for stakeholders
- **GITHUB_PAGES.md** - Detailed GitHub Pages setup
- **DEPLOY.md** - Alternative deployment options
- **README.md** - Full documentation

## 🎬 Demo the App

1. **Estimator** tab: Click 2 zones → price appears
2. **Left drawer**: Drag sliders → watch price update
3. **Batch** tab: Upload `/sample-shipments.csv`
4. **Settings**: Copy share link with pricing params

## 🔧 Rebuild After Changes

```bash
npm run build          # Builds to docs/
git add docs/
git commit -m "Update"
git push               # Auto-deploys to GitHub Pages
```

## 💡 Pro Tips

- The app works 100% client-side (no backend needed)
- Sample CSV file included: `public/sample-shipments.csv`
- Dark mode toggle in app bar
- Share URLs encode all pricing parameters

## 🏆 What You Built

- ✅ Interactive map with 12 zones
- ✅ Live pricing with <200ms updates
- ✅ 10+ tunable pricing parameters
- ✅ Batch CSV upload/pricing
- ✅ Presets save/load/export
- ✅ Shareable state URLs
- ✅ Responsive Vuetify UI
- ✅ TypeScript + Vue 3 + Pinia

**Total build time with LLM assistance: ~2 hours**

---

Need help? Check the other docs or open an issue!
