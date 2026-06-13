import axios from "axios";
import { getDb } from "../db";
import { worldCupMatches } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

let currentLiveVideoId: string | null = null;
let pollingInterval: NodeJS.Timeout | null = null;

// Official CazeTV channel ID; override from Vercel env if needed.
const CAZETV_CHANNEL_ID = process.env.CAZETV_CHANNEL_ID || process.env.YOUTUBE_CHANNEL_ID || "UCZiYbVptd3PVPf4f6eR6UaQ";

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
 * Fetch Channel Metadata (Stats & Snippet) via YouTube Data API v3
 */
export async function fetchChannelMetadata(apiKey: string, channelId: string = CAZETV_CHANNEL_ID) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${apiKey}`;
    const res = await axios.get(url, { timeout: 10000 });
    const item = res.data?.items?.[0];

    if (!item) return null;

    return {
      title: item.snippet.title,
      customUrl: item.snippet.customUrl,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      subscriberCount: formatYouTubeNumber(item.statistics.subscriberCount),
      videoCount: formatYouTubeNumber(item.statistics.videoCount),
      uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads
    };
  } catch (err: any) {
    console.error(`[YouTube API] Failed to fetch channel metadata: ${err.message}`);
    return null;
  }
}

/**
 * Fetch Channel Content (Videos, Shorts, Playlists) via YouTube Data API v3
 */
export async function fetchChannelContent(apiKey: string, type: string, channelId: string = CAZETV_CHANNEL_ID) {
  try {
    let url = "";
    // For standard videos, use the uploads playlist to save quota (1 unit vs 100 for search)
    if (type === "videos") {
      const meta = await fetchChannelMetadata(apiKey, channelId);
      if (!meta?.uploadsPlaylistId) throw new Error("No uploads playlist found");
      url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${meta.uploadsPlaylistId}&maxResults=20&key=${apiKey}`;
    } else if (type === "live") {
      url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=completed&order=date&maxResults=20&key=${apiKey}`;
    } else if (type === "shorts") {
      url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&videoDuration=short&maxResults=20&key=${apiKey}`;
    } else if (type === "playlists") {
      url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${channelId}&maxResults=10&key=${apiKey}`;
    }

    if (!url) return [];

    const res = await axios.get(url, { timeout: 10000 });
    const items = res.data?.items || [];

    return items.map((item: any) => {
      const snippet = item.snippet;
      const videoId = type === "videos" ? item.contentDetails?.videoId : (item.id?.videoId || item.id);
      return {
        id: videoId,
        title: snippet.title,
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url,
        duration: "", // Optional: requires extra API call to 'videos' endpoint
        views: "Authentic View Count",
        publishedAt: formatRelativeDate(snippet.publishedAt)
      };
    });
  } catch (err: any) {
    console.error(`[YouTube API] Failed to fetch channel ${type}: ${err.message}`);
    return [];
  }
}

/**
 * Helper: Format large numbers (e.g. 15200000 -> 15.2M)
 */
function formatYouTubeNumber(numStr: string): string {
  const num = parseInt(numStr, 10);
  if (isNaN(num)) return numStr;
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

/**
 * Helper: Format date to relative string
 */
function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Runs the polling task
 */
export async function pollCazeTvLive() {
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;

  let liveId: string | null = null;

  if (apiKey) {
    liveId = await fetchLiveIdFromApi(apiKey, CAZETV_CHANNEL_ID);
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
