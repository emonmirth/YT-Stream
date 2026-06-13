import { Router } from "express";
import axios from "axios";
import { getCachedLiveVideoId } from "../services/cazeTvPoller";
import { getProxyAgents } from "../services/proxyService";

const router = Router();

// Custom Axios instance optimized for streaming with timeouts (agents injected dynamically)
const proxyAxios = axios.create({
  timeout: 15000, // Reduced manifest fetch timeout
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  }
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

    res.setHeader("Content-Type", response.headers["content-type"] || "application/vnd.apple.mpegurl");
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

    res.setHeader("Content-Type", response.headers["content-type"] || "video/mp2t");
    if (response.headers["content-length"]) {
      res.setHeader("Content-Length", response.headers["content-length"]);
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

export default router;
