import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().or(z.string().min(1)),
  YOUTUBE_API_KEY: z.string().min(1),
  VITE_APP_ID: z.string().optional().default(""),
  JWT_SECRET: z.string().optional().default(""),
  OAUTH_SERVER_URL: z.string().optional().default(""),
  OWNER_OPEN_ID: z.string().optional().default(""),
  NODE_ENV: z.string().optional().default("development"),
  BUILT_IN_FORGE_API_URL: z.string().optional().default(""),
  BUILT_IN_FORGE_API_KEY: z.string().optional().default(""),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.warn(
    "[Env Validation Warning] Invalid environment variables:",
    parsed.error.format()
  );
}

export const ENV = {
  appId: parsed.data?.VITE_APP_ID ?? process.env.VITE_APP_ID ?? "",
  cookieSecret: parsed.data?.JWT_SECRET ?? process.env.JWT_SECRET ?? "",
  databaseUrl: parsed.data?.DATABASE_URL ?? process.env.DATABASE_URL ?? "",
  oAuthServerUrl: parsed.data?.OAUTH_SERVER_URL ?? process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: parsed.data?.OWNER_OPEN_ID ?? process.env.OWNER_OPEN_ID ?? "",
  isProduction: (parsed.data?.NODE_ENV ?? process.env.NODE_ENV) === "production",
  forgeApiUrl: parsed.data?.BUILT_IN_FORGE_API_URL ?? process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: parsed.data?.BUILT_IN_FORGE_API_KEY ?? process.env.BUILT_IN_FORGE_API_KEY ?? "",
  youtubeApiKey: parsed.data?.YOUTUBE_API_KEY ?? process.env.YOUTUBE_API_KEY ?? "",
};

