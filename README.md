# ⚽ YT Stream

An engineered, high-fidelity sports streaming platform featuring a premium dark-themed interface, designed for watching matches without geographical boundaries. Built with **React (Vite)**, **Express**, and **Drizzle ORM**, the platform bypasses regional streaming restrictions through a custom residential proxy tunneling layer and integrates live sports dashboards directly from Google.

---

## ⚡ Key Features

- **Premium Cinematographic Dark UI** – Sleek, responsive layout styled with deep blacks (`#0D0D0D`) and high-impact orange highlights, inspired by Netflix and Google TV interfaces.
- **Stateful HLS manifest rewrite & proxy** – Dynamically fetches remote playlists through Brazilian residential proxy nodes, statefully rewrites relative playlist/segment URIs, and streams media chunks (.ts) through optimized Express pipe buffers to defeat geo-blocking.
- **Automated CazeTV Live ID Polling** – Real-time background workers that scrape or call YouTube API endpoints to extract current streaming IDs, auto-updating active matches in the database.
- **Google Match Dashboard Integration** – Seamless, zero-maintenance integration of official Google match widgets right below the stream to view live scores, brackets, lineups, and match stats.
- **Robust Failsafe mechanisms** – Exponential backoff retries, connection timeout protection, and mock HLS playlist fallbacks that prevent stream crashes during network jitter.

---

## 🛠️ Architecture

```mermaid
graph TD
    User[Web Client] -->|React / hls.js| Player[Video Player Component]
    User -->|Google Match Widget| Google[Google Search Iframe]
    Player -->|Proxied HLS Manifest| AppServer[Express Server /api/proxy]
    AppServer -->|Residential Agent Tunnel| Proxy[Brazil Residential Proxy]
    Proxy -->|Fetch Stream| YouTube[YouTube Stream Endpoint]
    AppServer -->|Cached Live ID| Poller[Background Poller Service]
    Poller -->|Scrape / API| YouTube
    Poller -->|Update status| DB[(MySQL Database / Drizzle)]
```

### Tech Stack
* **Frontend**: React (Vite), TypeScript, Tailwind CSS, Lucide icons, Framer Motion, and HLS.js.
* **Backend**: Node.js, Express, tRPC (type-safe APIs), Axios.
* **Database**: MySQL/MariaDB with Drizzle ORM.
* **Deployment**: Configured with `vercel.json` serverless routing parameters.

---

## 🚀 Quick Setup & Configuration

### Prerequisites
- Node.js (v18+)
- MySQL or MariaDB instance
- (Optional) YouTube Data API v3 Key

### Environment Variables
Create a `.env` file in the root of the project:

```env
# Database Credentials
DATABASE_URL=mysql://user:password@localhost:3306/yt_stream

# Regional Proxy Settings
BRAZIL_PROXY_URL=http://username:password@br-proxy.provider.com:8080

# YouTube API Integration (Optional, poller falls back to scraper)
YOUTUBE_API_KEY=AIzaSyD_your_youtube_api_key_here
```

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Generate and push database schema**:
   ```bash
   npm run db:push
   ```

3. **Seed match schedule**:
   ```bash
   npm run db:seed
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📄 License
This project is licensed under the MIT License.
All rights to broadcast assets and source video materials belong to their respective rights holders (CazeTV / FIFA).
