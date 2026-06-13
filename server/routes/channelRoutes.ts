import { Router } from "express";
import { fetchChannelMetadata, fetchChannelContent } from "../services/cazeTvPoller";

const router = Router();

function getApiKey(): string {
  return process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY || "";
}

function getPageToken(req: any): string | undefined {
  return typeof req.query.pageToken === "string" && req.query.pageToken.length > 0
    ? req.query.pageToken
    : undefined;
}

function sendApiError(res: any, source: string, err: any) {
  const message = err?.message || "YouTube API request failed";
  console.error(`[ChannelRoutes] ${source}:`, message);
  return res.status(500).json({
    success: false,
    data: [],
    nextPageToken: null,
    error: message,
  });
}

async function handleChannelMetadata(res: any) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        data: null,
        error: "Missing YOUTUBE_API_KEY or GOOGLE_API_KEY",
      });
    }

    const channelInfo = await fetchChannelMetadata(apiKey);
    if (!channelInfo) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "Channel metadata not found",
      });
    }

    return res.json({ success: true, data: channelInfo });
  } catch (error) {
    return sendApiError(res, "/info", error);
  }
}

router.get("/", async (_req, res) => {
  return handleChannelMetadata(res);
});

router.get("/info", async (_req, res) => {
  return handleChannelMetadata(res);
});

router.get("/metadata", async (_req, res) => {
  return handleChannelMetadata(res);
});

async function handleChannelContent(req: any, res: any, type: "videos" | "shorts" | "live" | "playlists") {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        data: [],
        nextPageToken: null,
        error: "Missing YOUTUBE_API_KEY or GOOGLE_API_KEY",
      });
    }

    const result = await fetchChannelContent(apiKey, type, undefined, getPageToken(req));
    return res.json({
      success: true,
      data: result.items,
      nextPageToken: result.nextPageToken,
    });
  } catch (error) {
    return sendApiError(res, `/${type}`, error);
  }
}

router.get("/videos", (req, res) => handleChannelContent(req, res, "videos"));
router.get("/shorts", (req, res) => handleChannelContent(req, res, "shorts"));
router.get("/live", (req, res) => handleChannelContent(req, res, "live"));
router.get("/playlists", (req, res) => handleChannelContent(req, res, "playlists"));

export default router;
