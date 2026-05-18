# AI Memory — OM Tools

> **IMPORTANT:** Always read this file first before making any changes to the OM TOOLS project.

---

## Project Identity

| Key | Value |
|---|---|
| **Name** | OM Tools |
| **Tagline** | Free Media Downloader & Utility Platform |
| **GitHub** | https://github.com/omspradippatil/OM-TOOLS |
| **Live** | https://om-tools.netlify.app (planned) |
| **Stack** | React 19 + Vite 5 + Vanilla CSS |
| **Dev Port** | http://localhost:5174/ |
| **Owner** | OM Patil |

---

## Core Philosophy

- **Media-only platform** — Only media downloader tools (YouTube, Instagram, Shorts, Reels, Thumbnails, MP3).
- **PDF/Image tools are NOT part of this project.** They belong to OM PDF (https://om-pdf.netlify.app).
- PDF/Image are promoted in the footer under **"More by OM Patil"** with an OM PDF card linking to om-pdf.netlify.app.
- Design inspired by OM PDF's premium aesthetic: dark theme, glassmorphism, animated blobs, gradient text.
- **No backend yet** — Tool pages show a demo result card. Real downloads require a backend API (yt-dlp or similar).

---

## Architecture

```
OM-TOOLS/
├── .env                    ← Firebase secrets (git-ignored)
├── .gitignore
├── index.html              ← Full SEO: OG, Twitter, JSON-LD, sitemap link
├── vite.config.js          ← Code-split: vendor, firebase chunks
├── netlify.toml            ← SPA redirect, security headers, asset caching
├── public/
│   ├── robots.txt
│   └── sitemap.xml
└── src/
    ├── firebase.js         ← Firebase init from VITE_ env vars (analytics lazy)
    ├── App.jsx             ← BrowserRouter + all routes + Navbar + Footer
    ├── main.jsx            ← HelmetProvider entry
    ├── index.css           ← Global design system (tokens, buttons, cards, animations)
    ├── constants/
    │   ├── tools.js        ← TOOLS array, SUPPORTED_PLATFORMS, detectPlatform()
    │   └── seoData.js      ← Per-page SEO metadata
    ├── components/
    │   ├── SEO.jsx         ← react-helmet-async wrapper
    │   ├── Navbar.jsx      ← Sticky glass navbar, dropdown, hamburger
    │   ├── Navbar.css
    │   ├── Footer.jsx      ← Multi-col footer + OM PDF card
    │   ├── Footer.css
    │   ├── UrlInput.jsx    ← Smart URL input with platform detection
    │   └── UrlInput.css
    └── pages/
        ├── Home.jsx        ← Hero, stats, tool grid, platforms, features, CTA, FAQ
        ├── Home.css
        ├── ToolPage.jsx    ← Reusable media downloader page (skeleton, result card)
        ├── ToolPage.css
        ├── YoutubeDownloader.jsx
        ├── YoutubeMP3.jsx
        ├── ShortsDownloader.jsx
        ├── InstagramDownloader.jsx
        ├── ReelDownloader.jsx
        ├── ThumbnailDownloader.jsx
        ├── NotFound.jsx
        └── NotFound.css
```

---

## Design System (`src/index.css`)

### Color Tokens
| Token | Value | Usage |
|---|---|---|
| `--primary` | `#6C63FF` | Main brand purple |
| `--primary-dark` | `#4F46E5` | Hover/active states |
| `--primary-light` | `#8B85FF` | Text accents |
| `--accent` | `#FF6B9D` | Gradient accent (pink) |
| `--bg` | `#0A0A0F` | Page background |
| `--bg-card` | `#111118` | Card backgrounds |
| `--text` | `#F0F0F8` | Primary text |
| `--text-muted` | `#9090A8` | Secondary text |

### Key CSS Patterns
- `.card` — dark bg-card, 1px border, hover lift + border-color glow
- `.btn-primary` — `var(--grad-primary)` with purple glow shadow
- `.btn-outline` — transparent, primary border, hover fill
- `.badge-*` — pill badges: primary, success, accent, new
- `.gradient-text` — accent gradient text clip
- `.skeleton` — shimmer animation for loading states
- `@keyframes blob-pulse` — hero background blob movement
- `@keyframes fadeUp` — standard entrance animation

---

## Routes

| Path | Component | Notes |
|---|---|---|
| `/` | `Home` | Full landing page |
| `/youtube-video-downloader` | `YoutubeDownloader` | |
| `/youtube-mp3-converter` | `YoutubeMP3` | |
| `/shorts-downloader` | `ShortsDownloader` | |
| `/instagram-downloader` | `InstagramDownloader` | |
| `/instagram-reel-downloader` | `ReelDownloader` | |
| `/thumbnail-downloader` | `ThumbnailDownloader` | |
| `*` | `NotFound` | 404 page |

**❌ DO NOT add PDF or Image tool routes.** Those belong to om-pdf.netlify.app.

---

## Firebase

- Config stored in `.env` with `VITE_` prefix.
- `src/firebase.js` initializes the app and lazy-loads analytics (only if supported).
- No Firestore or Auth used currently — Firebase is analytics-only for now.
- `.env` is git-ignored. ✅

### env vars
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

---

## SEO Architecture

- `index.html` — base title, meta, OG, Twitter, JSON-LD (WebSite + FAQPage)
- `src/components/SEO.jsx` — per-page Helmet (title, description, canonical, OG, Twitter, schema)
- `src/constants/seoData.js` — centralized metadata for each page
- `public/sitemap.xml` — all 7 tool pages + home
- `public/robots.txt` — allow all, disallow /api/, sitemap link
- `netlify.toml` — security headers (X-Frame-Options, X-Content-Type-Options, etc.)

---

## ToolPage Component (`src/pages/ToolPage.jsx`)

- Shared across all 6 media downloader pages.
- Accepts: `seo`, `title`, `subtitle`, `icon`, `platform`, `supportedTypes`, `formats`, `faqs`, `features`, `inputPlaceholder`
- Reads `?url=` query param on mount (from hero UrlInput navigate)
- `detectPlatform()` validates the URL matches the tool's platform
- Shows skeleton loader → result card with format buttons
- **Demo mode** — `handleFetch()` simulates a network call (1.6s delay) and returns mock data.
- For YouTube: extracts video ID and uses `img.youtube.com` CDN for real thumbnails.
- Format buttons call `handleDownloadFormat()` — currently shows an alert explaining backend is needed.

### To connect real downloads:
Replace the `handleFetch()` simulation in `ToolPage.jsx` with a real API call to a yt-dlp backend.
Expected API response shape:
```js
{
  title: "Video Title",
  channel: "Channel Name",
  duration: "3:45",
  thumbnail: "https://...",
  formats: [
    { id: "mp4-1080", label: "MP4", quality: "1080p HD", size: "~85 MB" }
  ]
}
```

---

## Completed Sessions

### Session 1 — Initial Build
- [x] Scaffolded Vite + React project from scratch (no create-vite interactive)
- [x] Created global design system (`index.css`) with full token set
- [x] Built Navbar with glass effect, dropdown, hamburger menu
- [x] Built Footer with OM PDF card in "More by OM Patil" column
- [x] Built UrlInput with platform auto-detection and clipboard paste
- [x] Built Home page — hero blobs, stats counter, tool grid, platforms, features, CTA, FAQ
- [x] Built reusable `ToolPage` component for all media tool pages
- [x] Built 6 media tool pages: YouTube, MP3, Shorts, Instagram, Reel, Thumbnail
- [x] Firebase initialized from `.env` (git-ignored), analytics lazy-loaded
- [x] SEO: per-page Helmet, sitemap.xml, robots.txt, structured data
- [x] Production build: `✓ built in 1.52s` — no errors
- [x] `.env` created and confirmed in `.gitignore`

### Session 2 — Cleanup
- [x] Removed PDF/Image tools from TOOLS array, Navbar, routes, and tool grid
- [x] PDF/Image tools are now ONLY referenced in footer "More by OM Patil" → om-pdf.netlify.app
- [x] Build verified: `✓ built in 1.52s` — no errors

---

## ⚠️ Constraints (Never Change)

- **Never add PDF or Image tool pages/routes.** Direct users to om-pdf.netlify.app for those.
- Never commit `.env` — it contains Firebase secrets.
- The footer must always have the OM PDF card in "More by OM Patil".
- Platform detection (`detectPlatform()`) is the source of truth for URL routing.
- Keep `ToolPage.jsx` as the single shared component — do not duplicate it per tool.

---

## Preferred Tech for Future Expansion

Per user preference, future major refactors may adopt:
- **Next.js** (fullstack, SSR/SSG for SEO)
- **Tailwind CSS** (utility-first styling)
- **shadcn/ui** (component library)
- **Framer Motion** (animations)
- **Lucide Icons** (icon set)

Current build is Vite + Vanilla CSS — do not migrate until explicitly asked.

---

## Related Projects

| Project | URL | Notes |
|---|---|---|
| **OM PDF** | https://om-pdf.netlify.app | PDF toolkit — 20+ tools, 100% offline |
| **Portfolio** | https://ompradippatil.netlify.app/ | Developer portfolio |
