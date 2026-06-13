import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import axios, { AxiosError } from "axios";

/**
 * Brazilian Proxy Configuration
 * In production, replace with actual residential proxy credentials
 */
const PROXY_CONFIG = {
  // Example: Using a Brazilian residential proxy service
  // In production, use environment variables for credentials
  protocol: process.env.PROXY_PROTOCOL || "http",
  host: process.env.PROXY_HOST || "proxy.example.com",
  port: parseInt(process.env.PROXY_PORT || "8080"),
  auth: {
    username: process.env.PROXY_USERNAME || "user",
    password: process.env.PROXY_PASSWORD || "pass",
  },
};

/**
 * Create axios instance with Brazilian proxy configuration
 */
function createProxyAxios() {
  return axios.create({
    httpAgent: new (require("http").Agent)({
      proxy: `${PROXY_CONFIG.protocol}://${PROXY_CONFIG.auth.username}:${PROXY_CONFIG.auth.password}@${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`,
    }),
    httpsAgent: new (require("https").Agent)({
      proxy: `${PROXY_CONFIG.protocol}://${PROXY_CONFIG.auth.username}:${PROXY_CONFIG.auth.password}@${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`,
    }),
    timeout: 30000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "DNT": "1",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Cache-Control": "max-age=0",
    },
  });
}

/**
 * Proxy router for YouTube stream tunneling
 */
export const proxyRouter = router({
  /**
   * Fetch YouTube video page through Brazilian proxy
   * This retrieves the initial video page with stream metadata
   */
  fetchVideoPage: publicProcedure
    .input(z.object({
      videoId: z.string().min(1, "Video ID is required"),
    }))
    .query(async ({ input }) => {
      try {
        const proxyAxios = createProxyAxios();
        const url = `https://www.youtube.com/watch?v=${input.videoId}`;

        const response = await proxyAxios.get(url, {
          headers: {
            "Referer": "https://www.youtube.com/",
          },
        });

        // Extract initial data from the page
        const initialDataMatch = response.data.match(/var ytInitialData = ({.*?});/);
        if (!initialDataMatch) {
          throw new Error("Failed to extract initial data from YouTube page");
        }

        return {
          success: true,
          videoId: input.videoId,
          initialData: initialDataMatch[1],
        };
      } catch (error) {
        const axiosError = error as AxiosError;
        console.error("[Proxy] Error fetching video page:", axiosError.message);
        throw new Error(`Failed to fetch video page: ${axiosError.message}`);
      }
    }),

  /**
   * Fetch HLS manifest through Brazilian proxy
   * This retrieves the master playlist for adaptive bitrate streaming
   */
  fetchHLSManifest: publicProcedure
    .input(z.object({
      manifestUrl: z.string().url("Invalid manifest URL"),
    }))
    .query(async ({ input }) => {
      try {
        const proxyAxios = createProxyAxios();

        const response = await proxyAxios.get(input.manifestUrl, {
          headers: {
            "Referer": "https://www.youtube.com/",
            "Origin": "https://www.youtube.com",
          },
          responseType: "text",
        });

        // Rewrite manifest URLs to proxy through our backend
        const rewrittenManifest = rewriteManifestUrls(response.data);

        return {
          success: true,
          manifest: rewrittenManifest,
          contentType: response.headers["content-type"],
        };
      } catch (error) {
        const axiosError = error as AxiosError;
        console.error("[Proxy] Error fetching HLS manifest:", axiosError.message);
        throw new Error(`Failed to fetch HLS manifest: ${axiosError.message}`);
      }
    }),

  /**
   * Fetch HLS segment (video chunk) through Brazilian proxy
   * This retrieves individual video segments for streaming
   */
  fetchHLSSegment: publicProcedure
    .input(z.object({
      segmentUrl: z.string().url("Invalid segment URL"),
    }))
    .query(async ({ input }) => {
      try {
        const proxyAxios = createProxyAxios();

        const response = await proxyAxios.get(input.segmentUrl, {
          headers: {
            "Referer": "https://www.youtube.com/",
            "Range": "bytes=0-",
          },
          responseType: "arraybuffer",
        });

        // Return segment data as base64
        const base64Data = Buffer.from(response.data).toString("base64");

        return {
          success: true,
          data: base64Data,
          contentType: response.headers["content-type"],
          contentLength: response.headers["content-length"],
        };
      } catch (error) {
        const axiosError = error as AxiosError;
        console.error("[Proxy] Error fetching HLS segment:", axiosError.message);
        throw new Error(`Failed to fetch HLS segment: ${axiosError.message}`);
      }
    }),

  /**
   * Proxy generic HTTP request through Brazilian proxy
   * Used for fetching additional resources (subtitles, metadata, etc.)
   */
  proxyRequest: publicProcedure
    .input(z.object({
      url: z.string().url("Invalid URL"),
      method: z.enum(["GET", "POST"]).default("GET"),
      headers: z.record(z.string(), z.string()).optional(),
    }))
    .query(async ({ input }) => {
      try {
        const proxyAxios = createProxyAxios();

        const response = await proxyAxios.request({
          method: input.method as "GET" | "POST",
          url: input.url,
          headers: {
            ...input.headers,
            "Referer": "https://www.youtube.com/",
          },
          responseType: "arraybuffer",
        });

        // Return response data as base64
        const base64Data = Buffer.from(response.data).toString("base64");

        return {
          success: true,
          data: base64Data,
          contentType: response.headers["content-type"],
          status: response.status,
        };
      } catch (error) {
        const axiosError = error as AxiosError;
        console.error("[Proxy] Error proxying request:", axiosError.message);
        throw new Error(`Failed to proxy request: ${axiosError.message}`);
      }
    }),

  /**
   * Health check for proxy connectivity
   */
  healthCheck: publicProcedure.query(async () => {
    try {
      const proxyAxios = createProxyAxios();

      // Test proxy by fetching a small resource
      const response = await proxyAxios.get("https://www.youtube.com", {
        timeout: 5000,
      });

      return {
        success: true,
        status: "Proxy is operational",
        statusCode: response.status,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error("[Proxy] Health check failed:", axiosError.message);
      return {
        success: false,
        status: "Proxy is unavailable",
        error: axiosError.message,
      };
    }
  }),
});

/**
 * Rewrite manifest URLs to route through our backend proxy
 * This ensures all segment requests go through the Brazilian proxy
 */
function rewriteManifestUrls(manifest: string): string {
  // Replace absolute URLs with relative proxy URLs
  // This is a simplified example - actual implementation depends on manifest format
  return manifest
    .replace(/https:\/\/[^\s"']+\.m3u8/g, (url) => {
      // Convert to proxy endpoint
      return `/api/proxy/manifest?url=${encodeURIComponent(url)}`;
    })
    .replace(/https:\/\/[^\s"']+\.ts/g, (url) => {
      // Convert segment URLs to proxy endpoint
      return `/api/proxy/segment?url=${encodeURIComponent(url)}`;
    });
}
