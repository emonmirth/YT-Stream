import { Router } from "express";
import axios from "axios";
import { getProxyAgents } from "../services/proxyService";
import { buildHumanHeaders } from "./proxyRoutes";

const router = Router();

const CAZETV_CHANNEL_ID = "UCy1Ms2KSGF3eDYYo7dOBkJg";
const CAZETV_BASE = "https://www.youtube.com/@CazeTV";

// ─── Shared fetch helper ─────────────────────────────────────────────────────

async function fetchChannelPage(path: string): Promise<string> {
  const { httpsAgent, httpAgent } = await getProxyAgents();
  const url = `${CAZETV_BASE}${path}`;
  console.log(`[Channel] Fetching: ${url}`);
  const res = await axios.get(url, {
    httpsAgent,
    httpAgent,
    timeout: 7000,
    headers: buildHumanHeaders({ "Sec-Fetch-Dest": "document", "Sec-Fetch-Mode": "navigate" }),
    decompress: true,
  });
  if (typeof res.data !== "string") throw new Error("Non-string response from YouTube");
  return res.data as string;
}

// ─── ytInitialData extractor ─────────────────────────────────────────────────

function extractYtInitialData(html: string): any {
  // Try both endings: `};` and `};\n`
  const patterns = [
    /var ytInitialData\s*=\s*({.+?});\s*<\/script>/s,
    /var ytInitialData\s*=\s*({.+?});\s*(?:var|window)/s,
  ];
  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m) {
      try { return JSON.parse(m[1]); } catch { /* continue */ }
    }
  }
  return null;
}

// ─── Generic video item extractor (works for videos, shorts, live tabs) ──────

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  publishedAt: string;
  isLive?: boolean;
}

function extractVideoItems(data: any, limit = 20): VideoItem[] {
  const results: VideoItem[] = [];
  try {
    const tabs: any[] = data?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? [];
    for (const tab of tabs) {
      const contents =
        tab?.tabRenderer?.content?.richGridRenderer?.contents ??
        tab?.tabRenderer?.content?.sectionListRenderer?.contents ?? [];
      for (const item of contents) {
        const video =
          item?.richItemRenderer?.content?.videoRenderer ??
          item?.richItemRenderer?.content?.reelItemRenderer ??
          item?.itemSectionRenderer?.contents?.[0]?.videoRenderer;
        if (!video?.videoId) continue;
        const title =
          video?.title?.runs?.[0]?.text ??
          video?.headline?.runs?.[0]?.text ?? "Untitled";
        const thumb =
          video?.thumbnail?.thumbnails?.slice(-1)[0]?.url ??
          `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
        const duration =
          video?.lengthText?.simpleText ??
          video?.thumbnailOverlays?.[0]?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText ?? "";
        const views =
          video?.viewCountText?.simpleText ??
          video?.shortViewCountText?.simpleText ?? "";
        const published =
          video?.publishedTimeText?.simpleText ?? "";
        const isLive = !!video?.badges?.find?.((b: any) =>
          b?.metadataBadgeRenderer?.label === "LIVE NOW"
        );
        results.push({ id: video.videoId, title, thumbnail: thumb, duration, views, publishedAt: published, isLive });
        if (results.length >= limit) return results;
      }
    }
  } catch (e) {
    console.error("[Channel] Item extraction error:", e);
  }
  return results;
}

// ─── Fallback mock data ───────────────────────────────────────────────────────

const MOCK_VIDEOS: VideoItem[] = [
  { id: "WC2026_mock1", title: "Brasil x Argentina – Copa do Mundo 2026 | CazeTV", thumbnail: "https://i.ytimg.com/vi/WC2026_mock1/hqdefault.jpg", duration: "2:14:33", views: "4.2M views", publishedAt: "2 days ago" },
  { id: "WC2026_mock2", title: "Copa do Mundo 2026: Cobertura completa | CazeTV", thumbnail: "https://i.ytimg.com/vi/WC2026_mock2/hqdefault.jpg", duration: "1:45:00", views: "2.8M views", publishedAt: "3 days ago" },
  { id: "WC2026_mock3", title: "Melhores momentos Grupo A – Copa do Mundo 2026", thumbnail: "https://i.ytimg.com/vi/WC2026_mock3/hqdefault.jpg", duration: "45:21", views: "1.1M views", publishedAt: "5 days ago" },
  { id: "WC2026_mock4", title: "França x Espanha | Copa do Mundo 2026 – AO VIVO", thumbnail: "https://i.ytimg.com/vi/WC2026_mock4/hqdefault.jpg", duration: "2:05:12", views: "3.5M views", publishedAt: "1 week ago" },
  { id: "WC2026_mock5", title: "CazeTV | Abertura Copa do Mundo 2026 – Cerimônia", thumbnail: "https://i.ytimg.com/vi/WC2026_mock5/hqdefault.jpg", duration: "1:22:00", views: "5.7M views", publishedAt: "1 week ago" },
  { id: "WC2026_mock6", title: "Análise técnica: Brasil nas oitavas de final | CazeTV", thumbnail: "https://i.ytimg.com/vi/WC2026_mock6/hqdefault.jpg", duration: "38:44", views: "980K views", publishedAt: "1 week ago" },
];

const MOCK_SHORTS: VideoItem[] = [
  { id: "short_mock1", title: "⚽ Golaço do Vini Jr contra a Argentina! #Shorts", thumbnail: "https://i.ytimg.com/vi/short_mock1/hqdefault.jpg", duration: "0:58", views: "12M views", publishedAt: "1 day ago" },
  { id: "short_mock2", title: "Defesa incrível do goleiro! Copa 2026 #CazeTV #Shorts", thumbnail: "https://i.ytimg.com/vi/short_mock2/hqdefault.jpg", duration: "0:45", views: "8.3M views", publishedAt: "2 days ago" },
  { id: "short_mock3", title: "Reação da torcida brasileira no Maracanã 🇧🇷 #Shorts", thumbnail: "https://i.ytimg.com/vi/short_mock3/hqdefault.jpg", duration: "0:30", views: "6.1M views", publishedAt: "3 days ago" },
  { id: "short_mock4", title: "Pênalti decisivo! Copa do Mundo 2026 #Shorts", thumbnail: "https://i.ytimg.com/vi/short_mock4/hqdefault.jpg", duration: "0:52", views: "4.9M views", publishedAt: "4 days ago" },
];

const MOCK_LIVE: VideoItem[] = [
  { id: "live_mock1", title: "🔴 AO VIVO – Brasil x Alemanha | Copa do Mundo 2026 | CazeTV", thumbnail: "https://i.ytimg.com/vi/live_mock1/hqdefault.jpg", duration: "LIVE", views: "120K watching", publishedAt: "Started 2 hours ago", isLive: true },
  { id: "live_mock2", title: "🔴 AO VIVO – Transmissão Copa do Mundo 2026 Dia 5 | CazeTV", thumbnail: "https://i.ytimg.com/vi/live_mock2/hqdefault.jpg", duration: "3:22:15", views: "890K views", publishedAt: "5 days ago" },
  { id: "live_mock3", title: "🔴 Copa do Mundo 2026 – Fase de Grupos completa | CazeTV", thumbnail: "https://i.ytimg.com/vi/live_mock3/hqdefault.jpg", duration: "4:10:00", views: "2.1M views", publishedAt: "1 week ago" },
  { id: "live_mock4", title: "Cerimônia de abertura Copa 2026 – Transmissão ao vivo", thumbnail: "https://i.ytimg.com/vi/live_mock4/hqdefault.jpg", duration: "1:55:30", views: "6.4M views", publishedAt: "1 week ago" },
];

const MOCK_PLAYLISTS = [
  { id: "PL_mock1", title: "Copa do Mundo 2026 – Todos os jogos", thumbnail: "https://i.ytimg.com/vi/WC2026_mock1/hqdefault.jpg", videoCount: "104", description: "Transmissão completa de todos os 104 jogos da Copa do Mundo 2026" },
  { id: "PL_mock2", title: "Melhores momentos – Copa 2026", thumbnail: "https://i.ytimg.com/vi/WC2026_mock3/hqdefault.jpg", videoCount: "48", description: "Gols, defesas e lances incríveis" },
  { id: "PL_mock3", title: "Fase de Grupos – Copa 2026", thumbnail: "https://i.ytimg.com/vi/WC2026_mock5/hqdefault.jpg", videoCount: "48", description: "Todos os jogos da fase de grupos" },
  { id: "PL_mock4", title: "Shorts da Copa 2026", thumbnail: "https://i.ytimg.com/vi/short_mock1/hqdefault.jpg", videoCount: "120", description: "Os melhores momentos em formato curto" },
];

// ─── Routes ──────────────────────────────────────────────────────────────────

router.get("/videos", async (req, res) => {
  try {
    const html = await fetchChannelPage("/videos");
    const data = extractYtInitialData(html);
    const items = data ? extractVideoItems(data, 24) : [];
    if (items.length > 0) {
      return res.json({ success: true, data: items });
    }
    console.warn("[Channel] /videos scrape returned 0 items, using fallback");
    return res.json({ success: false, data: MOCK_VIDEOS, fallback: true });
  } catch (err: any) {
    console.error("[Channel] /videos error:", err.message);
    return res.json({ success: false, data: MOCK_VIDEOS, fallback: true });
  }
});

router.get("/shorts", async (req, res) => {
  try {
    const html = await fetchChannelPage("/shorts");
    const data = extractYtInitialData(html);
    const items = data ? extractVideoItems(data, 20) : [];
    if (items.length > 0) {
      return res.json({ success: true, data: items });
    }
    console.warn("[Channel] /shorts scrape returned 0 items, using fallback");
    return res.json({ success: false, data: MOCK_SHORTS, fallback: true });
  } catch (err: any) {
    console.error("[Channel] /shorts error:", err.message);
    return res.json({ success: false, data: MOCK_SHORTS, fallback: true });
  }
});

router.get("/live", async (req, res) => {
  try {
    const html = await fetchChannelPage("/streams");
    const data = extractYtInitialData(html);
    const items = data ? extractVideoItems(data, 20) : [];
    if (items.length > 0) {
      return res.json({ success: true, data: items });
    }
    console.warn("[Channel] /live scrape returned 0 items, using fallback");
    return res.json({ success: false, data: MOCK_LIVE, fallback: true });
  } catch (err: any) {
    console.error("[Channel] /live error:", err.message);
    return res.json({ success: false, data: MOCK_LIVE, fallback: true });
  }
});

router.get("/playlists", async (req, res) => {
  try {
    const html = await fetchChannelPage("/playlists");
    const data = extractYtInitialData(html);
    const playlists: any[] = [];
    if (data) {
      const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? [];
      for (const tab of tabs) {
        const items = tab?.tabRenderer?.content?.gridRenderer?.items ??
          tab?.tabRenderer?.content?.sectionListRenderer?.contents ?? [];
        for (const item of items) {
          const pl = item?.gridPlaylistRenderer ?? item?.lockupViewModel;
          if (!pl) continue;
          const id = pl?.playlistId ?? pl?.contentId ?? "";
          const title = pl?.title?.runs?.[0]?.text ?? pl?.metadata?.lockupMetadataViewModel?.title?.content ?? "Playlist";
          const thumb = pl?.thumbnail?.thumbnails?.slice(-1)[0]?.url ?? "";
          const count = pl?.videoCountText?.runs?.[0]?.text ?? "0";
          playlists.push({ id, title, thumbnail: thumb, videoCount: count, description: "" });
          if (playlists.length >= 12) break;
        }
      }
    }
    if (playlists.length > 0) {
      return res.json({ success: true, data: playlists });
    }
    return res.json({ success: false, data: MOCK_PLAYLISTS, fallback: true });
  } catch (err: any) {
    console.error("[Channel] /playlists error:", err.message);
    return res.json({ success: false, data: MOCK_PLAYLISTS, fallback: true });
  }
});

export default router;
