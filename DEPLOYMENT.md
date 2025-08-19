# 🚀 Deployment Instructions

## 📋 Quick Deployment Options

### 🟣 Vercel (Recommended - Easiest)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd "d:\OneDrive - Bina Nusantara\Demo App\Media Monitoring"
   vercel --prod
   ```

3. **Follow prompts:**
   - Link to existing project? `N`
   - Project name? `media-monitoring-demo`
   - Directory? `.` (current)
   - Auto-detect settings? `Y`

### 🟢 Netlify

1. **Build project**
   ```bash
   npm run build
   ```

2. **Deploy options:**
   - **Option A:** Drag & drop `dist/` folder to [netlify.com/drop](https://app.netlify.com/drop)
   - **Option B:** Connect GitHub repository di [netlify.com](https://netlify.com)

### 🔵 GitHub Pages

1. **Create gh-pages branch**
   ```bash
   npm run build
   git checkout -b gh-pages
   git add dist/ -f
   git commit -m "Deploy to GitHub Pages"
   git subtree push --prefix dist origin gh-pages
   ```

2. **Enable GitHub Pages** di repository settings

### ☁️ Manual Deployment

1. **Build project**
   ```bash
   npm run build
   ```

2. **Upload `dist/` folder** ke hosting provider:
   - Hostinger
   - DigitalOcean
   - AWS S3 + CloudFront
   - Firebase Hosting

## ⚙️ Environment Variables

Untuk production deployment, Anda mungkin perlu environment variables:

```bash
# .env.production
VITE_API_URL=https://your-api.com
VITE_APP_TITLE=Media Monitoring Demo
VITE_ANALYTICS_ID=your-analytics-id
```

## 🔧 Build Configuration

File `vite.config.ts` sudah dikonfigurasi untuk deployment optimal:

```typescript
export default defineConfig({
  plugins: [react()],
  base: './', // For relative paths
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable for production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts']
        }
      }
    }
  }
})
```

## 🌐 Domain Setup

Setelah deployment:

1. **Custom Domain** (optional):
   - Vercel: Add domain di dashboard
   - Netlify: Domain settings > Add custom domain
   - Manual: Configure DNS A/CNAME records

2. **SSL Certificate**: Otomatis di Vercel/Netlify

3. **CDN**: Otomatis di platform hosting modern

## 📊 Performance Optimization

Project sudah dioptimasi dengan:
- ✅ Code splitting dengan dynamic imports
- ✅ Tree shaking untuk mengurangi bundle size
- ✅ Lazy loading untuk komponen besar
- ✅ Optimized assets dengan Vite
- ✅ Responsive images

## 🚀 CI/CD Setup (Optional)

### GitHub Actions untuk auto-deploy:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run build
    - uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

---

**🎯 Recommended: Deploy ke Vercel untuk demo terbaik dengan zero-configuration!**
