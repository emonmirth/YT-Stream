import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { HttpProxyAgent } from "http-proxy-agent";

let cachedProxyUrl: string | null = null;
let cachedHttpsAgent: HttpsProxyAgent<string> | undefined;
let cachedHttpAgent: HttpProxyAgent<string> | undefined;
let lastFetchedTime = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Dynamically scrapes an active HTTP/HTTPS proxy filtered for Brazil (country=BR).
 */
export async function getDynamicBrazilProxy(): Promise<string> {
  const url = "https://proxylist.geonode.com/api/proxy-list?country=BR&protocols=http&limit=5&page=1&sort_by=lastChecked&sort_type=desc";
  try {
    console.log(`[Proxy Scraper] Scraping dynamic Brazil proxy from: ${url}`);
    const res = await axios.get(url, { timeout: 8000 });
    const data = res.data?.data;
    if (Array.isArray(data) && data.length > 0) {
      const proxy = data[0];
      if (proxy.ip && proxy.port) {
        // Prefer HTTP protocol if listed, fallback to protocols[0] or http
        const protocol = (proxy.protocols && proxy.protocols[0]) || "http";
        const proxyUrl = `${protocol}://${proxy.ip}:${proxy.port}`;
        console.log(`[Proxy Scraper] Found active Brazil proxy: ${proxyUrl}`);
        return proxyUrl;
      }
    }
    console.warn("[Proxy Scraper] No proxies found in Geonode response.");
  } catch (err: any) {
    console.error(`[Proxy Scraper] Failed to fetch dynamic Brazil proxy: ${err.message}`);
  }

  // Fallback Logic: fallback to BRAZIL_PROXY_URL env or local sandbox
  const fallback = process.env.BRAZIL_PROXY_URL || "http://127.0.0.1:8080";
  console.warn(`[Proxy Scraper] Falling back to proxy URL: ${fallback}`);
  return fallback;
}

/**
 * Returns cached or newly scraped proxy agents.
 */
export async function getProxyAgents() {
  const now = Date.now();
  if (!cachedProxyUrl || (now - lastFetchedTime > CACHE_DURATION_MS)) {
    try {
      cachedProxyUrl = await getDynamicBrazilProxy();
      cachedHttpsAgent = new HttpsProxyAgent(cachedProxyUrl);
      cachedHttpAgent = new HttpProxyAgent(cachedProxyUrl);
      lastFetchedTime = now;
    } catch (err) {
      console.error("[Proxy] Error creating agents:", err);
      if (!cachedProxyUrl) {
        cachedProxyUrl = process.env.BRAZIL_PROXY_URL || "http://127.0.0.1:8080";
        cachedHttpsAgent = new HttpsProxyAgent(cachedProxyUrl);
        cachedHttpAgent = new HttpProxyAgent(cachedProxyUrl);
      }
    }
  }
  return {
    proxyUrl: cachedProxyUrl,
    httpsAgent: cachedHttpsAgent,
    httpAgent: cachedHttpAgent,
  };
}
