import axios from "axios";
import { getDb } from "../db";
import { worldCupMatches } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

let currentLiveVideoId: string | null = null;
let pollingInterval: NodeJS.Timeout | null = null;

// Extracted from proxyRoutes.ts settings:
const proxyUrl = process.env.BRAZIL_PROXY_URL;
let pollerAxios = axios.create({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  }
});

import { HttpsProxyAgent } from "https-proxy-agent";
import { HttpProxyAgent } from "http-proxy-agent";

// Configure proxy agent if available
if (proxyUrl) {
  pollerAxios.defaults.httpsAgent = new HttpsProxyAgent(proxyUrl);
  pollerAxios.defaults.httpAgent = new HttpProxyAgent(proxyUrl);
}

/**
 * Strategy A: Fetch via YouTube Data API v3 if key is present
 */
async function fetchLiveIdFromApi(apiKey: string, channelId: string): Promise<string | null> {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`;
    const res = await axios.get(url, { timeout: 10000 });
    const items = res.data?.items;
    if (items && items.length > 0) {
      const liveId = items[0]?.id?.videoId;
      if (liveId) {
        console.log(`[Poller] Live ID found via YouTube API: ${liveId}`);
        return liveId;
      }
    }
  } catch (err: any) {
    console.error(`[Poller] YouTube Data API failed: ${err.message}`);
  }
  return null;
}

/**
 * Strategy B: Scrape /live page (fallback)
 */
async function fetchLiveIdFromScraping(channelUrl: string): Promise<string | null> {
  try {
    console.log(`[Poller] Scraping live page at ${channelUrl}...`);
    const res = await pollerAxios.get(channelUrl);
    const html = res.data;

    // Look for videoId inside ytInitialPlayerResponse or script payloads
    const matches = [
      html.match(/"liveStreamRenderer":\s*{\s*"videoId":\s*"([^"]+)"/),
      html.match(/"videoId"\s*:\s*"([^"]+)"/),
      html.match(/href="https:\/\/www\.youtube\.com\/watch\?v=([^"]+)"/),
      html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([^"]+)"/)
    ];

    for (const match of matches) {
      if (match && match[1]) {
        // Simple sanity check for a 11-char YouTube ID
        if (/^[a-zA-Z0-9_-]{11}$/.test(match[1])) {
          console.log(`[Poller] Live ID scraped successfully: ${match[1]}`);
          return match[1];
        }
      }
    }
  } catch (err: any) {
    console.error(`[Poller] Scraping fallback failed: ${err.message}`);
  }
  return null;
}

/**
 * Runs the polling task
 */
export async function pollCazeTvLive() {
  const channelId = "UCy1Ms2KSGF3eDYYo7dOBkJg"; // CazeTV Channel ID
  const channelLiveUrl = "https://www.youtube.com/@CazeTV/live";
  const apiKey = process.env.YOUTUBE_API_KEY;

  let liveId: string | null = null;

  if (apiKey) {
    liveId = await fetchLiveIdFromApi(apiKey, channelId);
  }

  // Fallback to scraping
  if (!liveId) {
    liveId = await fetchLiveIdFromScraping(channelLiveUrl);
  }

  if (liveId !== currentLiveVideoId) {
    console.log(`[Poller] State Change: Live Video ID transitioned from [${currentLiveVideoId}] to [${liveId}]`);
    currentLiveVideoId = liveId;

    // Update database for all matches that are currently marked "live"
    try {
      const db = await getDb();
      if (db) {
        if (liveId) {
          await db
            .update(worldCupMatches)
            .set({ youtubeVideoId: liveId, lastStatusUpdate: new Date() })
            .where(eq(worldCupMatches.status, "live"));
          console.log(`[Poller] Database updated: set live matches youtubeVideoId to ${liveId}`);
        }
      }
    } catch (dbErr: any) {
      console.error("[Poller] Failed to update live ID in database:", dbErr.message);
    }
  }
}

/**
 * Initializes and starts the background poller
 */
export function startLiveIdPoller(intervalMs = 90000) {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  console.log(`[Poller] Starting automated CazeTV Live ID Polling (every ${intervalMs / 1000}s)`);
  
  // Initial run
  pollCazeTvLive().catch(console.error);

  pollingInterval = setInterval(() => {
    pollCazeTvLive().catch(console.error);
  }, intervalMs);
}

/**
 * Stop poller
 */
export function stopLiveIdPoller() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log("[Poller] Stopped Live ID Polling.");
  }
}

/**
 * Retrieves the cached live ID
 */
export function getCachedLiveVideoId(): string | null {
  return currentLiveVideoId;
}
