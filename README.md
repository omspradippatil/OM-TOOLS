<div align="center">

<img src="https://img.shields.io/badge/OM%20Tools-6C63FF?style=for-the-badge&logo=lightning&logoColor=white" alt="OM Tools" />

# OM Tools

**Download Anything, Anywhere, Anytime.**

Free premium media downloader & utility platform — YouTube, Instagram, Shorts, Reels, and more.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Netlify-00C7B7?style=flat-square&logo=netlify)](https://om-tools.netlify.app)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/omspradippatil/OM-TOOLS)
[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Analytics-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)

🌐 **Live:** [https://om-tools.netlify.app](https://om-tools.netlify.app)

</div>

---

## ✨ Features

- ▶ **YouTube Video Downloader** — MP4 up to 4K, 1080p, 720p, 480p, 360p, 240p, 144p
- 🎵 **YouTube to MP3** — Extract audio at 320kbps, 256kbps, 192kbps; also M4A
- ⚡ **YouTube Shorts Downloader** — Download Shorts in HD with one click
- 📸 **Instagram Downloader** — Posts, Reels, IGTV videos, Photos — no watermark
- 🎞 **Instagram Reel Downloader** — Original HD quality, no watermark
- 🖼 **Thumbnail Downloader** — MaxRes, HQ, MQ, SD thumbnail extraction
- 🗂 **YouTube Playlist Downloader** — Downloader for entire playlists with multi-selection & local ZIP generation
- ⚙️ **Client-Side Media Editor** — 9 browser-powered offline media editing tools:
  - **Video Converter** — Convert between MP4, WEBM, MKV, AVI, and MOV
  - **Video Trimmer** — Lossless and instant clipping by time segments
  - **Video Compressor** — Smart CRF-based compression and resolution scaling
  - **Video to GIF Maker** — Two-pass palette generation for high-quality animated GIFs
  - **Video Muter** — Remove audio tracks instantly (lossless stream copy)
  - **Audio Extractor** — Extract audio track from any video to MP3, WAV, AAC, or OGG
  - **Audio Converter** — Convert audio between MP3, WAV, FLAC, OGG, AAC, and M4A
  - **Audio Trimmer** — Crop audio tracks with precise start/end settings
  - **Volume Booster** — Boost audio levels up to 4x (400%) with smart clipping warnings
- 🔒 **Secure & Private** — Downloader requests do not store logs, and all editor tools run 100% on your device (no uploads, $0 server cost)
- 📱 **Mobile-First** — Fully responsive, optimized for every device
- ⚡ **Fast** — Instant URL analysis with skeleton loaders, sequential fail-over pools, and smooth UX
- 📈 **SEO Optimized** — Sitemap, structured data, Open Graph, canonical URLs
- 🌐 **Multi-Platform** — YouTube, Instagram, TikTok, Twitter/X, Facebook

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) **v18 or higher**
- npm **v9 or higher**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/omspradippatil/OM-TOOLS.git
git checkout main
cd OM-TOOLS

# 2. Install dependencies
npm install

# 3. Create your .env file (copy from .env.example or add manually)
cp .env.example .env
# Fill in your Firebase credentials
```

### Run Locally

```bash
npm run dev
# → http://localhost:5173
```

### Build for Production

```bash
npm run build
# → outputs to dist/
```

### Preview Production Build

```bash
npm run preview
```

---

## 📁 Project Structure

```text
OM-TOOLS/
│
├── .env                       # Firebase secrets — NEVER commit
├── .gitignore                 # Ignores .env, node_modules, dist
├── index.html                 # Full SEO base — OG, Twitter, JSON-LD
├── vite.config.js             # Vite config — vendor/firebase/react chunks + proxies
├── netlify.toml               # SPA redirect + security headers + Edge Function mapping
├── netlify/                   # Netlify backend (serverless & edge functions)
│   ├── edge-functions/
│   │   └── stream.js          # Deno Edge streaming proxy for CORS/IP bypass
│   └── functions/
│       ├── download.cjs       # yt-dlp metadata API function
│       └── playlist.cjs       # YouTube playlist parser API function
├── AI_MEMORY.md               # Project memory for AI sessions — read first
│
├── public/
│   ├── robots.txt             # Crawler policy
│   └── sitemap.xml            # All tool + home URLs
│
└── src/
    ├── firebase.js            # Firebase init from env vars
    ├── App.jsx                # Root router — all 16 routes
    ├── main.jsx               # Entry — HelmetProvider
    ├── index.css              # Global design system & tokens
    │
    ├── constants/
    │   ├── tools.js           # Tool registry + platform detection
    │   └── seoData.js         # Per-page SEO metadata
    │
    ├── components/
    │   ├── SEO.jsx            # react-helmet-async wrapper
    │   ├── Navbar.jsx/css     # Sticky glass navbar + mega-dropdown (2 sections)
    │   ├── Footer.jsx/css     # Multi-col footer + OM PDF card
    │   ├── UrlInput.jsx/css   # Smart URL input + detection
    │   ├── LocalToolPage.jsx  # Reusable page container for local editor tools
    │   └── LocalToolPage.css  # Styles for drag-and-drop, controls, and download cards
    │
    ├── services/
    │   ├── downloader.js      # yt-dlp backend (primary) + Cobalt API pool fallback, stream verify, parallel chunking
    │   └── ffmpegLoader.js    # ffmpeg.wasm loader (loads single-threaded core from jsDelivr)
    │
    └── pages/
        ├── Home.jsx/css            # Landing page
        ├── ToolPage.jsx/css        # Reusable media downloader page shell
        ├── YoutubeDownloader.jsx   # /youtube-video-downloader
        ├── YoutubeMP3.jsx          # /youtube-mp3-converter
        ├── ShortsDownloader.jsx    # /shorts-downloader
        ├── InstagramDownloader.jsx # /instagram-downloader
        ├── ReelDownloader.jsx      # /instagram-reel-downloader
        ├── ThumbnailDownloader.jsx # /thumbnail-downloader
        ├── PlaylistDownloader.jsx  # /youtube-playlist-downloader (ZIP generation)
        ├── VideoConverter.jsx      # /video-converter (ffmpeg.wasm)
        ├── VideoTrimmer.jsx        # /video-trimmer (ffmpeg.wasm)
        ├── VideoCompressor.jsx     # /video-compressor (ffmpeg.wasm)
        ├── VideoToGif.jsx          # /video-to-gif (ffmpeg.wasm)
        ├── VideoMuter.jsx          # /video-muter (ffmpeg.wasm)
        ├── AudioExtractor.jsx      # /audio-extractor (ffmpeg.wasm)
        ├── AudioConverter.jsx      # /audio-converter (ffmpeg.wasm)
        ├── AudioTrimmer.jsx        # /audio-trimmer (ffmpeg.wasm)
        ├── VolumeBooster.jsx       # /volume-booster (ffmpeg.wasm)
        └── NotFound.jsx/css        # 404
```

---

## 🛠️ Tech Stack

### Current Stack

| Category | Technology |
|---|---|
| **Framework** | [React 19](https://react.dev/) + [Vite 5](https://vitejs.dev/) |
| **Routing** | [React Router 7](https://reactrouter.com/) |
| **SEO** | [react-helmet-async](https://github.com/staylor/react-helmet-async) |
| **Analytics** | [Firebase Analytics](https://firebase.google.com/) |
| **Client Engine** | [ffmpeg.wasm (v0.12)](https://github.com/ffmpegwasm/ffmpeg.wasm) + [JSZip (v3)](https://github.com/Stuk/jszip) |
| **Styling** | Vanilla CSS (Premium Design System) |
| **Deployment** | [Netlify](https://www.netlify.com/) |

### 🔮 Future / Preferred Tooling

> These tools are planned for future major refactors. **Do not migrate until explicitly requested.**

#### Fullstack Framework

| Tool | GitHub | Docs |
|---|---|---|
| **Next.js** | [vercel/next.js](https://github.com/vercel/next.js) | [nextjs.org](https://nextjs.org) |

#### UI / Design System

| Tool | GitHub | Docs / Site |
|---|---|---|
| **Tailwind CSS** | [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) | [tailwindcss.com](https://tailwindcss.com) |
| **shadcn/ui** | [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | [ui.shadcn.com](https://ui.shadcn.com) |
| **Framer Motion** | [motiondivision/motion](https://github.com/motiondivision/motion) | [motion.dev](https://motion.dev) |
| **Lucide Icons** | [lucide-icons/lucide](https://github.com/lucide-icons/lucide) | [lucide.dev](https://lucide.dev) |

---

## ⚙️ How It Works (Bypass Architecture)

OM Tools uses a **two-tier bypass architecture** to reliably download YouTube content even when YouTube blocks standard server-side requests:

### Tier 1 — Own yt-dlp Backend (Primary for YouTube)
1. **iOS Player Client**: The Netlify function runs `yt-dlp` with `--extractor-args "youtube:player_client=ios"`. The iOS player client is treated differently by YouTube and is **not subject to the "Sign in to confirm you're not a bot" requirement** that blocks standard browser/desktop clients.
2. **Multi-Client Fallback**: If the iOS client is blocked, the backend automatically tries `tv_embedded` → `mweb` → `default` clients in sequence.
3. **Stream Proxy**: Direct video/audio URLs returned by yt-dlp are routed through our Deno Edge Function (`/api/stream`) to handle CORS and IP restrictions.

### Tier 2 — Public Cobalt Pool (Secondary Fallback)
4. **Dynamic Instance Discovery**: If the yt-dlp backend fails for transient reasons, the frontend queries `instances.cobalt.best` and merges with 8 pre-verified fallback Cobalt instances. Query results and failures are cached to bypass repeated timeout delays.
5. **Dynamic Priority & Failover**: Speeds up start latency by sorting instances on the fly:
   - **Last Known Working Server**: Prioritizes and attempts the last successful server first.
   - **Blacklist Cooldown**: Temporarily blocks recently failed servers for 3 minutes.
6. **Stream Verification**: Performs a lightweight `Range: bytes=0-0` request on the returned download URL to verify the stream is non-empty before committing to a download.
7. **Native Downloads**: Triggers native browser file downloads via programmatic `<a>` anchor tag clicks to achieve 100% Wi-Fi bandwidth with zero browser memory overhead.

---

## 📦 Available Tool Pages

| Category | URL | Tool |
|---|---|---|
| **Downloader** | `/youtube-video-downloader` | YouTube Video Downloader |
| **Downloader** | `/youtube-mp3-converter` | YouTube to MP3 Converter |
| **Downloader** | `/shorts-downloader` | YouTube Shorts Downloader |
| **Downloader** | `/instagram-downloader` | Instagram Downloader |
| **Downloader** | `/instagram-reel-downloader` | Instagram Reel Downloader |
| **Downloader** | `/thumbnail-downloader` | YouTube Thumbnail Downloader |
| **Downloader** | `/youtube-playlist-downloader` | YouTube Playlist Downloader |
| **Media Editor** | `/video-converter` | Video Converter (ffmpeg.wasm) |
| **Media Editor** | `/video-trimmer` | Video Trimmer (ffmpeg.wasm) |
| **Media Editor** | `/video-compressor` | Video Compressor (ffmpeg.wasm) |
| **Media Editor** | `/video-to-gif` | Video to GIF Maker (ffmpeg.wasm) |
| **Media Editor** | `/video-muter` | Video Muter (ffmpeg.wasm) |
| **Media Editor** | `/audio-extractor` | Audio Extractor (ffmpeg.wasm) |
| **Media Editor** | `/audio-converter` | Audio Converter (ffmpeg.wasm) |
| **Media Editor** | `/audio-trimmer` | Audio Trimmer (ffmpeg.wasm) |
| **Media Editor** | `/volume-booster` | Volume Booster (ffmpeg.wasm) |

> 🔗 **Looking for PDF tools?** Check out [**OM PDF**](https://om-pdf.netlify.app) — 20+ free offline PDF tools by the same author.

---

## 🤝 Contributing

Contributions are welcome! Bug fixes, features, and improvements are appreciated.

> **Important:** By submitting a pull request, you agree that full ownership of your contribution is assigned to the project owner (OM Patil). See [LICENSE](LICENSE) for full terms.

### How to Contribute

1. **Fork** this repository
2. **Install** dependencies: `npm install`
3. **Create** a feature branch: `git checkout -b feature/my-feature`
4. **Commit** your changes: `git commit -m 'Add my feature'`
5. **Push**: `git push origin feature/my-feature`
6. **Open a Pull Request** 🎉

---

## 🐛 Bug Reports

Found a bug? [Open an issue](https://github.com/omspradippatil/OM-TOOLS/issues) with:

- A clear description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Browser & OS info

---

## 📜 License

This project uses a **Proprietary License** — see [LICENSE](LICENSE) for full terms.

- ✅ You may view and study the code
- ✅ You may contribute (rights assigned to the Owner)
- ✅ You may run it locally for personal use
- ❌ You may not copy, redistribute, or reuse the design
- ❌ You may not deploy a public instance without permission

**All rights reserved. Owner: OM Patil**

---

## ⭐ Show Your Support

If you find this project helpful, please give it a **⭐ star** on GitHub or consider [supporting me](https://ompradippatil.netlify.app/donate)!

---

## 👤 Contact

**Developed by OM Patil**

- **Portfolio**: [ompradippatil.netlify.app](https://ompradippatil.netlify.app/)
- **GitHub**: [@omspradippatil](https://github.com/omspradippatil)
- **LinkedIn**: [OM Pradip Patil](https://in.linkedin.com/in/om-pradip-patil)
- **Email**: [omspradippatil@gmail.com](mailto:omspradippatil@gmail.com)

---

<div align="center">

Built with ❤️ by **OM Patil** — All Rights Reserved.

</div>
