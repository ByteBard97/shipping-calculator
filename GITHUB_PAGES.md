# GitHub Pages Deployment Guide

## ✅ Project is Pre-Configured

This project is already set up to build into the `docs/` folder for GitHub Pages.

## 🚀 Deploy Steps

### 1. Build the Project

```bash
npm run build
```

This creates the production build in the `docs/` folder with the correct base path.

### 2. Push to GitHub

```bash
git add .
git commit -m "Initial commit with docs build"
git push origin main
```

### 3. Enable GitHub Pages

1. Go to your repo on GitHub
2. Click **Settings** tab
3. Click **Pages** in left sidebar
4. Under **Source**:
   - Select **Deploy from a branch**
   - Branch: **main**
   - Folder: **/docs**
   - Click **Save**

### 4. Access Your Site

After 1-2 minutes, your site will be live at:

```
https://YOUR-USERNAME.github.io/shipping-calculator/
```

GitHub will show you the exact URL in the Pages settings.

## 🔄 Update Your Deployment

Whenever you make changes:

```bash
# Make your code changes
npm run build
git add docs/
git commit -m "Update deployment"
git push
```

GitHub Pages will automatically redeploy within 1-2 minutes.

## ⚙️ Configuration Details

The project is configured with:

```ts
// vite.config.ts
export default defineConfig({
  base: '/shipping-calculator/',  // Matches your repo name
  build: {
    outDir: 'docs'                // Builds to docs/ folder
  },
  // ...
})
```

The `docs/.nojekyll` file tells GitHub Pages not to use Jekyll processing.

## 🐛 Troubleshooting

### Assets Not Loading (404 errors)

Make sure the `base` path in `vite.config.ts` matches your repo name exactly:

```ts
base: '/YOUR-REPO-NAME/',
```

### Page Shows 404

1. Check that GitHub Pages is enabled in Settings → Pages
2. Verify the branch is set to `main` and folder is `/docs`
3. Wait 2-3 minutes after pushing for GitHub to rebuild

### Custom Domain (Optional)

1. Add a `docs/CNAME` file with your domain:
   ```
   example.com
   ```
2. Configure DNS at your domain provider:
   - **A records** pointing to GitHub Pages IPs
   - Or **CNAME** pointing to `YOUR-USERNAME.github.io`

See [GitHub's custom domain guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)

## 📊 GitHub Actions (Optional Alternative)

Instead of committing `docs/`, you can use GitHub Actions to build automatically:

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

But the current setup (committing `docs/`) is simpler and works great!

## ✅ You're Done!

Your shipping calculator MVP is now live on GitHub Pages.

Share the link: `https://YOUR-USERNAME.github.io/shipping-calculator/`
