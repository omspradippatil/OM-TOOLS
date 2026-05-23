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
├── netlify.toml            ← SPA redirect, security headers, asset caching, edge mapping
├── netlify/
│   ├── edge-functions/
│   │   └── stream.js       ← Deno Edge streaming proxy for CORS/IP restriction bypass
│   └── functions/
│       ├── download.cjs    ← Metadata extraction (yt-dlp)
│       └── playlist.cjs    ← Playlist metadata extraction
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
        ├── PlaylistDownloader.jsx
        ├── PlaylistDownloader.css
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
| `/youtube-playlist-downloader` | `PlaylistDownloader` | |
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
- For YouTube: extracts video ID and uses `img.youtube.com` CDN for real thumbnails.
- Format buttons call `handleDownload()` to trigger on-device download and conversion.

### Download & Proxy Architecture (Bypass / Direct Cobalt Pool):
1. **Dynamic Cobalt Discovery**: The frontend queries `instances.cobalt.best` to discover active public Cobalt instances on-demand, falling back to a pre-verified pool of 8 instances. API results (and failures) are cached in memory to bypass 2-second timeout delays on subsequent requests.
2. **Dynamic Priority & Failover**: The downloader uses smart memory caching to speed up startup times:
   - **Last Known Working Server**: The last successful Cobalt server is prioritized and tried first, reducing start latency to milliseconds.
   - **Blacklist Cooldown**: Recently failed servers are temporarily blacklisted for 3 minutes to avoid retrying them.
3. **Stream Verification**: When an instance returns a download link, the client performs a lightweight `Range: bytes=0-0` GET fetch. If the instance returns an empty stream (status 200/206 with `Content-Length: 0` and missing or `-1` `Estimated-Content-Length`), it fails verification. The system automatically discards the broken instance and tries the next candidate in the pool.
4. **Direct Server-Side Processing**: The frontend requests Cobalt to fetch, transcode, and merge the media server-side. This avoids browser CORS errors and YouTube IP bans, and eliminates client-side `ffmpeg.wasm` CPU/memory overhead.
5. **Native Browser Download**: All formats (including high-resolution MP4s and MP3 transcodes) are downloaded natively via programmatic `<a>` anchor tag click. This hits 100% Wi-Fi speed and avoids crashing the browser tab with large file buffers.

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

### Session 3 — Fix YouTube Downloader
- [x] Fixed `getFetchUrl()` ReferenceError in `downloader.js` sequential fallback
- [x] Configured `ToolPage.jsx` and `downloader.js` to route `googlevideo.com` requests through `/api/stream` in both dev and production
- [x] Implemented production-ready Deno Edge Function streaming proxy at `netlify/edge-functions/stream.js` to bypass CORS and 403 IP limits without hitting the 6MB Netlify payload cap
- [x] Mapped `/api/stream` route in `netlify.toml`

### Session 4 — Migrate to Cobalt API Pool & Native Downloads
- [x] Migrated media downloader to use public Cobalt API pool with dynamic active server fetching from `instances.cobalt.best` (2s timeout).
- [x] Implemented robust pool fallback with 8 pre-verified active public instances tried sequentially.
- [x] Correctly mapped Cobalt request parameters to v10 schema (`videoQuality`, `downloadMode`, `audioFormat`, `audioBitrate`).
- [x] Bypassed client-side `ffmpeg.wasm` transcoding and huge memory buffers by setting `needsConvert: false` for all MP3 presets.
- [x] Routed all downloads (MP4/MP3/Shorts) to browser native `<a>` anchor tag downloads, boosting speed to 100% Wi-Fi bandwidth and preventing browser tab crashes.

### Session 5 — Implement Stream Verification & Download Speed Optimizations
- [x] Switched download method from iframe to programmatic `<a>` anchor tag click to bypass sandbox restrictions.
- [x] Implemented stream headers verification using `Range: bytes=0-0` GET requests inside the Cobalt loop.
- [x] Detected and filtered out faulty instances (such as `dog.kittycat.boo`) that return 0-byte content streams despite returning API success responses.
- [x] Implemented dynamic listing caching, last-working-instance prioritization, and 3-minute failure cooldown blacklists to eliminate startup delays.
- [x] Suppressed verbose trace warning logs for dynamic instance fetch failures by logging only `error.message` for cleaner developer console status.
- [x] Verified build compilation compiles cleanly.

### Session 6 — Speed Optimization (Parallel Chunking + Server Benchmarking)
- [x] Replaced `Range: bytes=0-0` stream verification with a full 100KB probe chunk (`Range: bytes=0-102400`) that measures actual transfer speed (`speedKBps`).
- [x] Routes all `googlevideo.com` probe requests through `/api/stream` edge proxy to avoid CORS errors during verification.
- [x] Updated `fetchCobaltLink` to test up to 3 candidate Cobalt servers and automatically select the fastest one. Returns immediately if a server exceeds 1.5 MB/s threshold.
- [x] Returns `{ url, filename, totalSize, supportsRange, speedKBps }` from `fetchCobaltLink` for smart routing in the UI layer.
- [x] Increased parallel chunk concurrency in `downloadToBuffer` from 4 to 6 threads.
- [x] Increased progress reporting interval from 500ms to 400ms for smoother real-time speed display.
- [x] Added smart routing in `ToolPage.jsx`: files ≤ 150MB with Range support → `downloadToBuffer` (parallel multi-thread, full speed + progress overlay); files > 150MB or unknown size → native `<a>` anchor download (0 RAM overhead).
- [x] Verified build compilation compiles cleanly (`✓ built in 2.84s`).

### Session 7 — Playlist Downloader with In-Browser ZIP Compression & Backend Fallbacks
- [x] Added Netlify serverless function `netlify/functions/playlist.cjs` using a bracket-matching JSON scanner to parse YouTube playlist HTML, automatically rewriting `music.youtube.com` domains to `www.youtube.com` to bypass YT Music's dynamic client-side rendering.
- [x] Implemented URL normalization in the serverless backend to automatically convert mixed video-playlist URLs (`watch?v=...&list=PL...`) into dedicated clean playlist landing pages (`playlist?list=PL...`), preventing 500 parsing errors on mixed URLs.
- [x] Configured proxy routing in `vite.config.js` and production redirects in `netlify.toml` for `/api/playlist` and `/api/download`.
- [x] Added `jszip` client-side zip utility to `package.json` dependencies.
- [x] Reduced individual Cobalt server timeouts from 8s to 4s in `downloader.js` to accelerate candidate fail-over speeds.
- [x] Cleaned up Cobalt POST request payloads in `tryCobaltInstance` to strictly match Cobalt v10 schema (mapping `downloadMode` to `"video"`/`"audio"` and removing unsupported properties like `audioBitrate` that caused strict servers to fail with `error.api.invalid_body`).
- [x] Implemented a robust fallback in `downloader.js`: if all Cobalt servers fail (e.g. returning `error.api.youtube.login` blocks), it calls our Netlify `/api/download` function running `yt-dlp`, routing it through the CORS edge streaming proxy at maximum parallel download speed.
- [x] Added session state caching `cobaltBlocked` inside `downloader.js` to bypass Cobalt completely on subsequent items if Cobalt has failed for the current playlist download session, preventing repeated timeout delays (e.g., 30s per video) and accelerating downloads.
- [x] Implemented modern `PlaylistDownloader` page and stylesheet, featuring a scrollable checkbox selection grid, formats dropdown, download progress modal, and custom unzipping guides (Windows, macOS, Android, iOS).
- [x] Added smart auto-navigation from the Home page input bar for URLs containing `list=` query parameters.
- [x] Implemented mobile/low-RAM memory warnings for playlists containing more than 10 HD video downloads.
- [x] Verified production build compiles successfully.





---

## ⚠️ Constraints (Never Change)

- **Never add PDF or Image tool pages/routes.** Direct users to om-pdf.netlify.app for those.
- Never commit `.env` — it contains Firebase secrets.
- The footer must always have the OM PDF card in "More by OM Patil".
- Platform detection (`detectPlatform()`) is the source of truth for URL routing.
- Keep `ToolPage.jsx` as the single shared component — do not duplicate it per tool.

---

## Preferred Tech for Future Expansion

Per user preference, future major refactors may adopt the following. **Do not migrate until explicitly asked.**

### Fullstack Framework

| Tool | GitHub | Docs |
|---|---|---|
| **Next.js** | [vercel/next.js](https://github.com/vercel/next.js) | [nextjs.org](https://nextjs.org) |

### UI / Design System

| Tool | GitHub | Docs / Site |
|---|---|---|
| **Tailwind CSS** | [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) | [tailwindcss.com](https://tailwindcss.com) |
| **shadcn/ui** | [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | [ui.shadcn.com](https://ui.shadcn.com) |
| **Framer Motion** | [motiondivision/motion](https://github.com/motiondivision/motion) | [motion.dev](https://motion.dev) |
| **Lucide Icons** | [lucide-icons/lucide](https://github.com/lucide-icons/lucide) | [lucide.dev](https://lucide.dev) |

Current build is Vite + Vanilla CSS — do not migrate until explicitly asked.

---

## Related Projects

| Project | URL | Notes |
|---|---|---|
| **OM PDF** | https://om-pdf.netlify.app | PDF toolkit — 20+ tools, 100% offline |
| **Portfolio** | https://ompradippatil.netlify.app/ | Developer portfolio |
