import { Router } from "express";
import axios from "axios";

const router = Router();

const DEFAULT_CAZETV_CHANNEL_ID = "UCZiYbVptd3PVPf4f6eR6UaQ";
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  durationSeconds?: number;
  views: string;
  publishedAt: string;
  isLive?: boolean;
}

interface PlaylistItem {
  id: string;
  title: string;
  thumbnail: string;
  videoCount: string;
  description: string;
}

interface ChannelMetadata {
  id: string;
  title: string;
  handle: string;
  description: string;
  avatar: string;
  banner: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  uploadsPlaylistId: string;
}

function getApiKey(): string {
  return process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY || "";
}

function getChannelId(): string {
  return process.env.CAZETV_CHANNEL_ID || process.env.YOUTUBE_CHANNEL_ID || DEFAULT_CAZETV_CHANNEL_ID;
}

function requireApiKey(): string {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Missing YOUTUBE_API_KEY or GOOGLE_API_KEY environment variable");
  }
  return apiKey;
}

async function youtubeGet<T>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
  const apiKey = requireApiKey();
  const res = await axios.get<T>(`${YOUTUBE_API_BASE}/${path}`, {
    timeout: 10000,
    params: {
      ...params,
      key: apiKey,
    },
  });
  return res.data;
}

function bestThumbnail(thumbnails: any): string {
  return (
    thumbnails?.maxres?.url ||
    thumbnails?.standard?.url ||
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    ""
  );
}

function formatCompactNumber(value: string | number | undefined): string {
  const count = Number(value || 0);
  if (!Number.isFinite(count)) return "0";
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: count >= 1_000_000 ? 1 : 0,
  }).format(count);
}

function formatViews(value: string | number | undefined, isLive?: boolean): string {
  const suffix = isLive ? " watching" : " views";
  return `${formatCompactNumber(value)}${suffix}`;
}

function formatPublishedAt(value: string | undefined): string {
  if (!value) return "";

  const publishedAt = new Date(value);
  const elapsedMs = Date.now() - publishedAt.getTime();
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return "";

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (elapsedMs < hour) return `${Math.max(1, Math.floor(elapsedMs / minute))} minutes ago`;
  if (elapsedMs < day) return `${Math.floor(elapsedMs / hour)} hours ago`;
  if (elapsedMs < week) return `${Math.floor(elapsedMs / day)} days ago`;
  if (elapsedMs < month) return `${Math.floor(elapsedMs / week)} weeks ago`;
  if (elapsedMs < year) return `${Math.floor(elapsedMs / month)} months ago`;
  return `${Math.floor(elapsedMs / year)} years ago`;
}

function parseIsoDuration(duration: string | undefined): number {
  if (!duration) return 0;
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;
  const [, hours = "0", minutes = "0", seconds = "0"] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

function formatDuration(duration: string | undefined, isLive?: boolean): string {
  if (isLive) return "LIVE";
  const totalSeconds = parseIsoDuration(duration);
  if (!totalSeconds) return "";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function sendApiError(res: any, source: string, err: any) {
  const status = err.response?.status || 500;
  const message = err.response?.data?.error?.message || err.message || "YouTube API request failed";
  console.error(`[Channel] ${source} error:`, message);
  return res.status(status).json({
    success: false,
    data: [],
    error: message,
  });
}

async function getChannelMetadata(): Promise<ChannelMetadata> {
  const channelId = getChannelId();
  const data = await youtubeGet<any>("channels", {
    part: "snippet,statistics,contentDetails,brandingSettings",
    id: channelId,
  });

  const channel = data.items?.[0];
  if (!channel) {
    throw new Error(`YouTube channel not found for id ${channelId}`);
  }

  return {
    id: channel.id,
    title: channel.snippet?.title || "CazéTV",
    handle: channel.snippet?.customUrl || "@CazeTV",
    description: channel.snippet?.description || "",
    avatar: bestThumbnail(channel.snippet?.thumbnails),
    banner: channel.brandingSettings?.image?.bannerExternalUrl || "",
    subscriberCount: formatCompactNumber(channel.statistics?.subscriberCount),
    videoCount: formatCompactNumber(channel.statistics?.videoCount),
    viewCount: formatCompactNumber(channel.statistics?.viewCount),
    uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads || "",
  };
}

async function fetchVideoDetails(videoIds: string[]): Promise<Map<string, any>> {
  const details = new Map<string, any>();
  const uniqueIds = Array.from(new Set(videoIds)).filter(Boolean);
  if (uniqueIds.length === 0) return details;

  const data = await youtubeGet<any>("videos", {
    part: "snippet,contentDetails,statistics,liveStreamingDetails",
    id: uniqueIds.join(","),
  });

  for (const item of data.items || []) {
    details.set(item.id, item);
  }

  return details;
}

async function fetchUploads(maxResults: number): Promise<VideoItem[]> {
  const channel = await getChannelMetadata();
  if (!channel.uploadsPlaylistId) {
    throw new Error("Channel uploads playlist is unavailable");
  }

  const data = await youtubeGet<any>("playlistItems", {
    part: "snippet,contentDetails",
    playlistId: channel.uploadsPlaylistId,
    maxResults,
  });

  const videoIds = (data.items || [])
    .map((item: any) => item.contentDetails?.videoId || item.snippet?.resourceId?.videoId)
    .filter(Boolean);
  const details = await fetchVideoDetails(videoIds);

  return videoIds
    .map((id: string) => toVideoItem(details.get(id), false))
    .filter((item: VideoItem | null): item is VideoItem => Boolean(item));
}

function toVideoItem(video: any, forceLive: boolean): VideoItem | null {
  if (!video?.id) return null;
  const liveState = video.snippet?.liveBroadcastContent;
  const isLive = forceLive || liveState === "live";
  const durationSeconds = parseIsoDuration(video.contentDetails?.duration);
  const viewers = isLive
    ? video.liveStreamingDetails?.concurrentViewers || video.statistics?.viewCount
    : video.statistics?.viewCount;

  return {
    id: video.id,
    title: video.snippet?.title || "Untitled",
    thumbnail: bestThumbnail(video.snippet?.thumbnails) || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
    duration: formatDuration(video.contentDetails?.duration, isLive),
    durationSeconds,
    views: formatViews(viewers, isLive),
    publishedAt: isLive ? "Live now" : formatPublishedAt(video.snippet?.publishedAt),
    isLive,
  };
}

async function fetchLiveVideos(): Promise<VideoItem[]> {
  const channelId = getChannelId();
  const liveData = await youtubeGet<any>("search", {
    part: "snippet",
    channelId,
    eventType: "live",
    type: "video",
    order: "date",
    maxResults: 20,
  });

  let videoIds = (liveData.items || [])
    .map((item: any) => item.id?.videoId)
    .filter(Boolean);
  let forceLive = true;

  if (videoIds.length === 0) {
    const completedData = await youtubeGet<any>("search", {
      part: "snippet",
      channelId,
      eventType: "completed",
      type: "video",
      order: "date",
      maxResults: 20,
    });
    videoIds = (completedData.items || [])
      .map((item: any) => item.id?.videoId)
      .filter(Boolean);
    forceLive = false;
  }

  const details = await fetchVideoDetails(videoIds);
  return videoIds
    .map((id: string) => toVideoItem(details.get(id), forceLive))
    .filter((item: VideoItem | null): item is VideoItem => Boolean(item));
}

async function fetchPlaylists(): Promise<PlaylistItem[]> {
  const channelId = getChannelId();
  const data = await youtubeGet<any>("playlists", {
    part: "snippet,contentDetails",
    channelId,
    maxResults: 24,
  });

  return (data.items || []).map((playlist: any) => ({
    id: playlist.id,
    title: playlist.snippet?.title || "Playlist",
    thumbnail: bestThumbnail(playlist.snippet?.thumbnails),
    videoCount: String(playlist.contentDetails?.itemCount || 0),
    description: playlist.snippet?.description || "",
  }));
}

router.get("/", async (_req, res) => {
  try {
    return res.json({ success: true, data: await getChannelMetadata() });
  } catch (err: any) {
    return sendApiError(res, "/", err);
  }
});

router.get("/metadata", async (_req, res) => {
  try {
    return res.json({ success: true, data: await getChannelMetadata() });
  } catch (err: any) {
    return sendApiError(res, "/metadata", err);
  }
});

router.get("/info", async (_req, res) => {
  try {
    const metadata = await getChannelMetadata();
    return res.json({
      success: true,
      data: {
        title: metadata.title,
        customUrl: metadata.handle,
        thumbnail: metadata.avatar,
        subscriberCount: metadata.subscriberCount,
        videoCount: metadata.videoCount,
      },
    });
  } catch (err: any) {
    return sendApiError(res, "/info", err);
  }
});

router.get("/videos", async (_req, res) => {
  try {
    const items = (await fetchUploads(24)).filter((item) => (item.durationSeconds || 0) > 60);
    return res.json({ success: true, data: items });
  } catch (err: any) {
    return sendApiError(res, "/videos", err);
  }
});

router.get("/shorts", async (_req, res) => {
  try {
    const items = (await fetchUploads(50)).filter((item) => {
      const seconds = item.durationSeconds || 0;
      return seconds > 0 && seconds <= 60;
    }).slice(0, 24);
    return res.json({ success: true, data: items });
  } catch (err: any) {
    return sendApiError(res, "/shorts", err);
  }
});

router.get("/live", async (_req, res) => {
  try {
    return res.json({ success: true, data: await fetchLiveVideos() });
  } catch (err: any) {
    return sendApiError(res, "/live", err);
  }
});

router.get("/playlists", async (_req, res) => {
  try {
    return res.json({ success: true, data: await fetchPlaylists() });
  } catch (err: any) {
    return sendApiError(res, "/playlists", err);
  }
});

export default router;
