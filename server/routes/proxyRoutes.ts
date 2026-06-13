import { Router } from "express";
import axios from "axios";
import { getCachedLiveVideoId } from "../services/cazeTvPoller";
import { getProxyAgents } from "../services/proxyService";

const router = Router();

// Helper to safely set response headers in Express from Axios header values
function safeSetHeader(res: any, name: string, value: any, fallback?: string) {
  if (typeof value === "string" || typeof value === "number") {
    res.setHeader(name, value);
  } else if (Array.isArray(value)) {
    res.setHeader(name, value.map(String));
  } else if (fallback !== undefined) {
    res.setHeader(name, fallback);
  }
}

// Rotating real-browser User-Agent pool (desktop Chrome/Firefox + mobile)
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/** Builds a realistic human browser header set for a Brazilian user. */
export function buildHumanHeaders(extra?: Record<string, string>): Record<string, string> {
  const ua = randomUA();
  const isChrome = ua.includes("Chrome");
  return {
    "User-Agent": ua,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "DNT": "1",
    "Cache-Control": "max-age=0",
    "Referer": "https://www.youtube.com/",
    "Origin": "https://www.youtube.com",
    // Simulate Chrome's sec-fetch headers to look like a real navigation
    ...(isChrome ? {
      "sec-ch-ua": `"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"`,
      "sec-ch-ua-mobile": ua.includes("Mobile") ? "?1" : "?0",
      "sec-ch-ua-platform": ua.includes("Windows") ? `"Windows"` : ua.includes("Mac") ? `"macOS"` : `"Linux"`,
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
    } : {}),
    // YouTube CONSENT cookie to bypass age/region dialogs
    "Cookie": "CONSENT=YES+yt.432984.en+FX+035; GPS=1; YSC=fakeid123; VISITOR_INFO1_LIVE=fakevisitor;",
    ...extra,
  };
}

// Custom Axios instance optimized for streaming
const proxyAxios = axios.create({
  timeout: 15000,
  headers: buildHumanHeaders(),
});

// Helper for Exponential Backoff Retry mechanism
async function fetchWithRetry(url: string, options: any = {}, retries = 3, delayMs = 500): Promise<any> {
  try {
    const { httpsAgent, httpAgent } = await getProxyAgents();
    const mergedOptions = {
      ...options,
      httpsAgent,
      httpAgent,
    };
    return await proxyAxios.get(url, mergedOptions);
  } catch (error: any) {
    const status = error.response?.status;
    // Retry on timeouts, connection failures, or transient 5xx server errors
    const isNetworkError = !error.response;
    const isServerError = status >= 500 && status <= 599;

    if ((isNetworkError || isServerError) && retries > 0) {
      console.warn(`[Proxy Retry] Failed fetch to ${url.slice(0, 60)}: ${error.message}. Retrying in ${delayMs}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return fetchWithRetry(url, options, retries - 1, delayMs * 2);
    }
    throw error;
  }
}

// Global middleware for CORS configuration handling
router.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range, Origin");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204); // Handle CORS preflight cleanly
  }
  next();
});

/**
 * Route: GET /api/proxy/live-id
 * Exposes the currently detected CazeTV Live Stream ID.
 */
router.get("/live-id", (req, res) => {
  const liveId = getCachedLiveVideoId();
  return res.json({
    success: true,
    liveId: liveId || null,
    status: liveId ? "online" : "offline",
    timestamp: new Date().toISOString()
  });
});

/**
 * Route: GET /api/proxy/stream?videoId=...
 * Scrapes the YouTube watch page using the proxy, extracts the HLS master manifest URL, and returns it.
 */
router.get("/stream", async (req, res) => {
  const { videoId } = req.query;
  if (!videoId || typeof videoId !== "string") {
    return res.status(400).json({ error: "videoId query parameter is required" });
  }

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`[Proxy] Fetching YouTube watch page for ID: ${videoId} through proxy...`);
    
    // Scrape with retry failsafe
    const response = await fetchWithRetry(url, {
      headers: {
        "Origin": "https://www.youtube.com",
        "Referer": "https://www.youtube.com/",
      }
    });

    const html = response.data;
    if (typeof html !== "string") {
      throw new Error("Invalid response format received from YouTube watch page");
    }
    
    // Attempt 1: Fast regex for direct HLS manifest URL matching
    const hlsMatch = html.match(/"hlsManifestUrl"\s*:\s*"([^"]+)"/);
    if (hlsMatch) {
      const cleanUrl = hlsMatch[1].replace(/\\/g, "");
      console.log(`[Proxy] Found HLS manifest URL via direct regex matching.`);
      return res.json({ success: true, manifestUrl: cleanUrl });
    }

    // Attempt 2: Parse ytInitialPlayerResponse
    const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (playerResponseMatch) {
      try {
        const playerResponse = JSON.parse(playerResponseMatch[1]);
        const manifestUrl = playerResponse.streamingData?.hlsManifestUrl;
        if (manifestUrl) {
          console.log(`[Proxy] Found HLS manifest URL in ytInitialPlayerResponse.`);
          return res.json({ success: true, manifestUrl });
        }
      } catch (err) {
        console.error("[Proxy] Failed to parse ytInitialPlayerResponse JSON:", err);
      }
    }

    // Attempt 3: Alternative regex for script ending
    const playerResponseMatch2 = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*<\/script>/);
    if (playerResponseMatch2) {
      try {
        const playerResponse = JSON.parse(playerResponseMatch2[1]);
        const manifestUrl = playerResponse.streamingData?.hlsManifestUrl;
        if (manifestUrl) {
          console.log(`[Proxy] Found HLS manifest URL in ytInitialPlayerResponse alternative match.`);
          return res.json({ success: true, manifestUrl });
        }
      } catch (err) {
        console.error("[Proxy] Failed to parse alternative ytInitialPlayerResponse JSON:", err);
      }
    }

    throw new Error("HLS stream URL not found on the YouTube page. The video may not be live or is private.");
  } catch (error: any) {
    console.error(`[Proxy] Error in /stream endpoint:`, error.message);
    return res.status(500).json({ error: error.message || "Failed to fetch stream" });
  }
});

/**
 * Helper to statefully rewrite HLS manifest content
 */
function rewriteManifest(content: string, originalUrl: string): string {
  const lines = content.split("\n");
  let isPlaylistNext = false;
  let isSegmentNext = false;

  const rewrittenLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    if (trimmed.startsWith("#")) {
      if (trimmed.startsWith("#EXT-X-STREAM-INF")) {
        isPlaylistNext = true;
        isSegmentNext = false;
      } else if (trimmed.startsWith("#EXTINF")) {
        isSegmentNext = true;
        isPlaylistNext = false;
      }

      // Also rewrite URIs inside tags (like subtitles, audio, keys, etc.)
      if (trimmed.includes("URI=")) {
        return trimmed.replace(/URI="([^"]+)"/g, (match, relUrl) => {
          try {
            const absoluteUrl = new URL(relUrl, originalUrl).toString();
            const endpoint = absoluteUrl.includes(".m3u8") ? "manifest" : "segment";
            return `URI="/api/proxy/${endpoint}?url=${encodeURIComponent(absoluteUrl)}"`;
          } catch (e) {
            return match;
          }
        });
      }
      return line;
    }

    // It's a URL to a playlist or a segment
    try {
      const absoluteUrl = new URL(trimmed, originalUrl).toString();
      let endpoint = "segment";
      if (isPlaylistNext) {
        endpoint = "manifest";
      } else if (isSegmentNext) {
        endpoint = "segment";
      } else {
        endpoint = absoluteUrl.includes(".m3u8") ? "manifest" : "segment";
      }

      // Reset state flags
      isPlaylistNext = false;
      isSegmentNext = false;

      return `/api/proxy/${endpoint}?url=${encodeURIComponent(absoluteUrl)}`;
    } catch (e) {
      return line;
    }
  });

  return rewrittenLines.join("\n");
}

/**
 * Route: GET /api/proxy/manifest?url=...
 * Fetches HLS manifests (.m3u8) through the Brazilian proxy and rewrites URLs statefully.
 */
router.get("/manifest", async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    return res.status(400).send("url parameter is required");
  }

  try {
    console.log(`[Proxy] Fetching manifest through proxy: ${url.slice(0, 80)}...`);
    const response = await fetchWithRetry(url, {
      responseType: "text",
      headers: {
        "Origin": "https://www.youtube.com",
        "Referer": "https://www.youtube.com/",
      }
    });

    const rewrittenContent = rewriteManifest(response.data, url);

    safeSetHeader(res, "Content-Type", response.headers["content-type"], "application/vnd.apple.mpegurl");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    return res.status(200).send(rewrittenContent);
  } catch (error: any) {
    console.error(`[Proxy] Error in /manifest:`, error.message);
    
    // Fail-safe manifest fallback: Return valid minimal M3U8 with EXT-X-ENDLIST to prevent player crash
    const fallbackManifest = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-ENDLIST\n`;
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    return res.status(200).send(fallbackManifest);
  }
});

/**
 * Route: GET /api/proxy/segment?url=...
 * Streams media segments (.ts) through the proxy directly back to the player with CORS.
 */
router.get("/segment", async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    return res.status(400).send("url parameter is required");
  }

  try {
    const { httpsAgent, httpAgent } = await getProxyAgents();
    // Media segments might use a separate axios config with slightly larger timeout
    const response = await proxyAxios.get(url, {
      responseType: "stream",
      timeout: 20000, // 20s timeout limit for full segments
      httpsAgent,
      httpAgent,
      headers: {
        "Origin": "https://www.youtube.com",
        "Referer": "https://www.youtube.com/",
      }
    });

    safeSetHeader(res, "Content-Type", response.headers["content-type"], "video/mp2t");
    if (response.headers["content-length"]) {
      safeSetHeader(res, "Content-Length", response.headers["content-length"]);
    }
    
    // Pipe the proxy stream directly to the Express client response
    response.data.pipe(res);

    response.data.on("error", (err: any) => {
      console.error("[Proxy] Stream piping error:", err.message);
      if (!res.headersSent) {
        res.status(503).setHeader("Retry-After", "2");
        res.send("Stream transfer interrupted");
      }
    });
  } catch (error: any) {
    console.error(`[Proxy] Error in /segment:`, error.message);
    if (!res.headersSent) {
      res.status(503).setHeader("Retry-After", "2");
      return res.send(`Failed to proxy segment: ${error.message}`);
    }
  }
});

/**
 * Route: GET /api/proxy/stream-url?videoId=...
 * Serves the rewritten HLS manifest directly to the frontend.
 */
router.get("/stream-url", async (req, res) => {
  const { videoId } = req.query;
  if (!videoId || typeof videoId !== "string") {
    return res.status(400).send("videoId parameter is required");
  }

  try {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`[Proxy] stream-url fetching YouTube watch page for ID: ${videoId}...`);
    
    const response = await fetchWithRetry(watchUrl, {
      headers: {
        "Origin": "https://www.youtube.com",
        "Referer": "https://www.youtube.com/",
      }
    });

    const html = response.data;
    if (typeof html !== "string") {
      throw new Error("Invalid response format received from YouTube watch page");
    }

    let streamUrl: string | null = null;

    // Attempt 1: Fast regex for direct HLS manifest URL matching
    const hlsMatch = html.match(/"hlsManifestUrl"\s*:\s*"([^"]+)"/);
    if (hlsMatch) {
      streamUrl = hlsMatch[1].replace(/\\/g, "");
    }

    // Attempt 2: Parse ytInitialPlayerResponse
    if (!streamUrl) {
      const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
      if (playerResponseMatch) {
        try {
          const playerResponse = JSON.parse(playerResponseMatch[1]);
          streamUrl = playerResponse.streamingData?.hlsManifestUrl || null;
        } catch (err) {
          console.error("[Proxy] Failed to parse ytInitialPlayerResponse JSON:", err);
        }
      }
    }

    // Attempt 3: Alternative regex for script ending
    if (!streamUrl) {
      const playerResponseMatch2 = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*<\/script>/);
      if (playerResponseMatch2) {
        try {
          const playerResponse = JSON.parse(playerResponseMatch2[1]);
          streamUrl = playerResponse.streamingData?.hlsManifestUrl || null;
        } catch (err) {
          console.error("[Proxy] Failed to parse alternative ytInitialPlayerResponse JSON:", err);
        }
      }
    }

    if (!streamUrl) {
      throw new Error("HLS stream URL not found on the YouTube watch page");
    }

    // Fetch the actual manifest content and rewrite it
    console.log(`[Proxy] stream-url fetching manifest: ${streamUrl.slice(0, 80)}...`);
    const manifestResponse = await fetchWithRetry(streamUrl, {
      responseType: "text",
      headers: {
        "Origin": "https://www.youtube.com",
        "Referer": "https://www.youtube.com/",
      }
    });

    const rewrittenContent = rewriteManifest(manifestResponse.data, streamUrl);

    safeSetHeader(res, "Content-Type", manifestResponse.headers["content-type"], "application/vnd.apple.mpegurl");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    return res.status(200).send(rewrittenContent);

  } catch (error: any) {
    console.error(`[Proxy] Error in /stream-url:`, error.message);
    const fallbackManifest = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-ENDLIST\n`;
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    return res.status(200).send(fallbackManifest);
  }
});

export default router;
