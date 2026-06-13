import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, datetime, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * World Cup 2026 Match Schedule Table
 * Stores all 104 FIFA World Cup matches with metadata
 */
export const worldCupMatches = mysqlTable("world_cup_matches", {
  id: int("id").autoincrement().primaryKey(),
  
  // Match Identification
  matchId: varchar("matchId", { length: 64 }).notNull().unique(),
  
  // Team Information
  team1: varchar("team1", { length: 100 }).notNull(),
  team2: varchar("team2", { length: 100 }).notNull(),
  
  // Match Details
  stage: mysqlEnum("stage", [
    "group_stage",
    "round_of_16",
    "quarterfinals",
    "semifinals",
    "third_place",
    "final"
  ]).notNull(),
  
  group: varchar("group", { length: 10 }), // For group stage: A, B, C, D, E, F, G, H
  
  // Scheduling
  scheduledTime: datetime("scheduledTime").notNull(),
  timezoneBRT: varchar("timezoneBRT", { length: 50 }).notNull(), // e.g., "16:00 BRT"
  
  // Venue Information
  stadium: varchar("stadium", { length: 150 }),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  
  // Broadcast Information
  broadcaster: varchar("broadcaster", { length: 100 }).default("CazeTV"),
  youtubeChannelId: varchar("youtubeChannelId", { length: 100 }),
  youtubeVideoId: varchar("youtubeVideoId", { length: 100 }),
  
  // Stream URLs
  hlsManifestUrl: text("hlsManifestUrl"), // HLS master playlist URL
  dashManifestUrl: text("dashManifestUrl"), // DASH manifest URL (optional)
  
  // Match Status
  status: mysqlEnum("status", [
    "scheduled",
    "live",
    "completed",
    "postponed",
    "cancelled"
  ]).default("scheduled").notNull(),
  
  // Match Results (populated after match completion)
  team1Goals: int("team1Goals"),
  team2Goals: int("team2Goals"),
  team1PenaltyGoals: int("team1PenaltyGoals"),
  team2PenaltyGoals: int("team2PenaltyGoals"),
  
  // Metadata
  description: text("description"),
  notes: text("notes"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastStatusUpdate: timestamp("lastStatusUpdate").defaultNow(),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
}));

export type WorldCupMatch = typeof worldCupMatches.$inferSelect;
export type InsertWorldCupMatch = typeof worldCupMatches.$inferInsert;

/**
 * Stream Quality Variants Table
 * Stores available quality options for each match
 */
export const streamQualityVariants = mysqlTable("stream_quality_variants", {
  id: int("id").autoincrement().primaryKey(),
  
  matchId: int("matchId").notNull(),
  
  // Quality Information
  quality: mysqlEnum("quality", [
    "360p",
    "480p",
    "720p",
    "1080p",
    "2160p"
  ]).notNull(),
  
  bitrate: int("bitrate"), // in kbps
  resolution: varchar("resolution", { length: 20 }), // e.g., "1920x1080"
  codec: varchar("codec", { length: 50 }), // e.g., "h264", "h265"
  
  // Stream URLs for this quality
  hlsPlaylistUrl: text("hlsPlaylistUrl"),
  dashPlaylistUrl: text("dashPlaylistUrl"),
  
  // Availability
  isAvailable: int("isAvailable").default(1), // 1 = available, 0 = unavailable
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StreamQualityVariant = typeof streamQualityVariants.$inferSelect;
export type InsertStreamQualityVariant = typeof streamQualityVariants.$inferInsert;

/**
 * Broadcast Rights Attribution Table
 * Tracks broadcast rights holders and attribution information
 */
export const broadcastRights = mysqlTable("broadcast_rights", {
  id: int("id").autoincrement().primaryKey(),
  
  // Rights Holder Information
  rightsholder: varchar("rightsholder", { length: 100 }).notNull(), // e.g., "CazeTV"
  country: varchar("country", { length: 100 }).notNull(), // e.g., "Brazil"
  
  // Contact & Attribution
  websiteUrl: varchar("websiteUrl", { length: 255 }),
  youtubeChannelUrl: varchar("youtubeChannelUrl", { length: 255 }),
  youtubeChannelId: varchar("youtubeChannelId", { length: 100 }),
  
  // Rights Details
  startDate: datetime("startDate"),
  endDate: datetime("endDate"),
  description: text("description"),
  
  // Attribution Text
  attributionText: text("attributionText"), // Full attribution statement
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BroadcastRights = typeof broadcastRights.$inferSelect;
export type InsertBroadcastRights = typeof broadcastRights.$inferInsert;
