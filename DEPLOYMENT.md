# 🚀 Deployment Guide - HRAI Mind v3

Complete guide for deploying HRAI Mind v3 to production.

---

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Deployment Platforms](#deployment-platforms)
4. [Post-Deployment](#post-deployment)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### ✅ Before You Deploy

- [ ] All tests passing (`npm run test:all`)
- [ ] TypeScript compilation successful (`npm run check`)
- [ ] Production build successful (`npm run build`)
- [ ] Security audit completed (`npm audit`)
- [ ] PWA manifest configured
- [ ] Service worker tested
- [ ] Environment variables set
- [ ] HTTPS certificate ready
- [ ] Domain name configured
- [ ] CDN setup (optional)

### 🔍 Quality Checks

```bash
# Run all quality checks
npm run check         # TypeScript
npm test             # Unit tests
npm run test:e2e     # E2E tests (optional, requires server)
npm run build        # Production build
```

**Expected Results:**
- TypeScript: 0 errors
- Unit Tests: 41/41 passing
- Build Size: ~6-7 MB (with AI models excluded)
- No critical security vulnerabilities

---

## Environment Setup

### Required Environment Variables

Create a `.env.production` file:

```bash
# Node Environment
NODE_ENV=production

# App Configuration
VITE_APP_NAME="HRAI Mind v3"
VITE_APP_URL=https://your-domain.com

# Feature Flags (optional)
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=false

# API Keys (if needed for future features)
# VITE_API_KEY=your-api-key-here
```

**Note:** All `VITE_*` variables are embedded in the client bundle. **Do not store secrets here.**

### Build Configuration

**vite.config.ts** is already optimized for production:
- ✅ Minification enabled (Terser)
- ✅ Console logs removed
- ✅ Source maps disabled (smaller build)
- ✅ Code splitting configured
- ✅ Chunk optimization

---

## Deployment Platforms

### Option 1: Vercel (Recommended) ⭐

**Why Vercel:**
- Zero-config deployment
- Automatic HTTPS
- Edge network (fast global delivery)
- Easy rollbacks
- Preview deployments for PRs

#### Deploy to Vercel

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
# First time deployment
vercel

# Production deployment
vercel --prod
```

4. **Configure Project:**
- Build Command: `npm run build`
- Output Directory: `dist/public`
- Install Command: `npm install`
- Node Version: 18.x or 20.x

5. **Set Environment Variables:**
```bash
vercel env add VITE_APP_URL production
# Enter: https://your-domain.vercel.app
```

#### vercel.json Configuration

Already included in repo:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public",
  "framework": "vite",
  "installCommand": "npm install"
}
```

---

### Option 2: Netlify

**Why Netlify:**
- Similar to Vercel
- Great for static sites
- Built-in forms and functions
- Generous free tier

#### Deploy to Netlify

1. **Install Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **Login:**
```bash
netlify login
```

3. **Initialize:**
```bash
netlify init
```

4. **Deploy:**
```bash
netlify deploy --prod
```

#### netlify.toml Configuration

Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist/public"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
```

---

### Option 3: Cloudflare Pages

**Why Cloudflare Pages:**
- Fast edge network
- Free unlimited bandwidth
- Integrated with Cloudflare CDN
- Great analytics

#### Deploy to Cloudflare Pages

1. **Connect GitHub:**
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Connect your GitHub repository

2. **Configure Build:**
   - Build command: `npm run build`
   - Build output: `dist/public`
   - Root directory: (leave blank)

3. **Deploy:**
   - Push to `main` branch
   - Automatic deployment triggered

---

### Option 4: Self-Hosted (VPS/Dedicated Server)

**Requirements:**
- Node.js 18.x or 20.x
- Nginx or Apache
- SSL certificate (Let's Encrypt)

#### Setup with Nginx

1. **Build the app:**
```bash
npm run build
```

2. **Transfer files to server:**
```bash
rsync -avz dist/public/ user@your-server:/var/www/hrai-mind/
```

3. **Nginx configuration** (`/etc/nginx/sites-available/hrai-mind`):
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Root directory
    root /var/www/hrai-mind;
    index index.html;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker - no cache
    location = /service-worker.js {
        add_header Cache-Control "no-cache";
        expires 0;
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_comp_level 6;
}
```

4. **Enable site and restart Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/hrai-mind /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. **Get SSL certificate:**
```bash
sudo certbot --nginx -d your-domain.com
```

---

## Post-Deployment

### 1. Verify Deployment ✅

**Check these URLs:**
- `https://your-domain.com/` - Homepage loads
- `https://your-domain.com/chat` - Chat page works
- `https://your-domain.com/manifest.json` - PWA manifest
- `https://your-domain.com/service-worker.js` - Service worker

### 2. Test PWA Installation 📱

**Desktop (Chrome/Edge):**
1. Visit your site
2. Look for install icon in address bar
3. Click to install
4. Verify app opens in standalone window

**Mobile (Android Chrome):**
1. Visit your site
2. Tap "Add to Home Screen"
3. Launch from home screen
4. Verify standalone mode

### 3. Test Offline Mode 🔌

1. Visit site and let it fully load
2. Disconnect internet
3. Reload page - should work from cache
4. Try navigating - should work offline

### 4. Performance Audit 🚀

```bash
# Run Lighthouse audit
npx lighthouse https://your-domain.com --view
```

**Target Scores:**
- Performance: 90+
- Accessibility: 100
- Best Practices: 95+
- SEO: 90+
- PWA: ✅ Installable

### 5. Browser Testing 🌐

Test in:
- ✅ Chrome 113+ (primary)
- ✅ Edge 113+ (primary)
- ⚠️ Firefox (limited - no WebGPU)
- ⚠️ Safari (limited - no WebGPU)

---

## Monitoring & Maintenance

### Analytics (Optional)

**Option 1: Self-Hosted**
- [Plausible Analytics](https://plausible.io/)
- [Umami](https://umami.is/)
- [PostHog](https://posthog.com/)

**Option 2: Privacy-Friendly**
- [Fathom Analytics](https://usefathom.com/)
- [Simple Analytics](https://simpleanalytics.com/)

### Error Monitoring (Optional)

- [Sentry](https://sentry.io/) - Error tracking
- [LogRocket](https://logrocket.com/) - Session replay
- [Rollbar](https://rollbar.com/) - Error monitoring

### Uptime Monitoring

- [UptimeRobot](https://uptimerobot.com/) - Free uptime monitoring
- [Pingdom](https://www.pingdom.com/)
- [StatusCake](https://www.statuscake.com/)

### Regular Maintenance Tasks

**Weekly:**
- Check error logs
- Monitor performance metrics
- Review user feedback

**Monthly:**
- Update dependencies (`npm update`)
- Run security audit (`npm audit`)
- Review analytics

**Quarterly:**
- Major dependency updates
- Performance optimization review
- User testing sessions

---

## Troubleshooting

### Build Fails

**Issue:** `npm run build` fails

**Solutions:**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build

# Check Node version
node --version  # Should be 18.x or 20.x

# Check for TypeScript errors
npm run check
```

### PWA Not Installing

**Issue:** Install button doesn't appear

**Check:**
1. HTTPS is enabled (required for PWA)
2. `manifest.json` is accessible
3. Service worker registered successfully
4. No console errors

**Debug:**
```javascript
// Chrome DevTools > Application > Manifest
// Check for manifest errors

// Chrome DevTools > Application > Service Workers
// Verify registration status
```

### Offline Mode Not Working

**Issue:** App doesn't work offline

**Solutions:**
1. Check service worker is registered
2. Verify cache is populated (DevTools > Application > Cache Storage)
3. Test in incognito/private window
4. Clear cache and re-visit site

### Performance Issues

**Issue:** Slow load times

**Optimize:**
```bash
# Analyze bundle size
npm run build
# Check dist/stats.html

# Lighthouse audit
npx lighthouse https://your-domain.com
```

**Common fixes:**
- Enable CDN
- Optimize images
- Enable Brotli compression
- Lazy load components

---

## Production Checklist

### 🎯 Go-Live Checklist

- [ ] Domain configured and DNS propagated
- [ ] HTTPS certificate installed
- [ ] PWA manifest verified
- [ ] Service worker tested
- [ ] Offline mode working
- [ ] All tests passing
- [ ] Security headers configured
- [ ] Analytics setup (optional)
- [ ] Error monitoring setup (optional)
- [ ] Backup strategy in place
- [ ] Rollback plan ready
- [ ] Team notified
- [ ] Documentation updated

### 📊 Success Metrics

After deployment, monitor:
- Uptime: > 99.9%
- Load time: < 3 seconds
- Lighthouse score: > 90
- Zero critical errors
- PWA installation rate
- User engagement

---

## Additional Resources

### Documentation
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [PWA Best Practices](https://web.dev/pwa-checklist/)
- [WebGPU Documentation](https://www.w3.org/TR/webgpu/)

### Support
- [GitHub Issues](https://github.com/HR-894/HR-AI-MIND/issues)
- [Contributing Guide](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

---

## Quick Deploy Commands

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod

# Build only
npm run build

# Full CI check
npm run check && npm test && npm run build
```

---

**🚀 Ready to deploy? Choose your platform and follow the guide above!**

*Last updated: November 12, 2025*
