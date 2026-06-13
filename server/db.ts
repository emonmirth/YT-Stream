import { eq, desc, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, worldCupMatches, streamQualityVariants, broadcastRights } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * World Cup Match Database Helpers
 */

export async function getAllMatches() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get matches: database not available");
    return [];
  }

  try {
    return await db
      .select()
      .from(worldCupMatches)
      .orderBy(worldCupMatches.scheduledTime);
  } catch (error) {
    console.error("[Database] Failed to get matches:", error);
    return [];
  }
}

export async function getMatchById(matchId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get match: database not available");
    return undefined;
  }

  try {
    const result = await db
      .select()
      .from(worldCupMatches)
      .where(eq(worldCupMatches.matchId, matchId))
      .limit(1);

    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get match:", error);
    return undefined;
  }
}

export async function getLiveMatches() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get live matches: database not available");
    return [];
  }

  try {
    return await db
      .select()
      .from(worldCupMatches)
      .where(eq(worldCupMatches.status, "live"))
      .orderBy(worldCupMatches.scheduledTime);
  } catch (error) {
    console.error("[Database] Failed to get live matches:", error);
    return [];
  }
}

export async function getUpcomingMatches(limit = 10) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get upcoming matches: database not available");
    return [];
  }

  try {
    const now = new Date();
    return await db
      .select()
      .from(worldCupMatches)
      .where(
        and(
          eq(worldCupMatches.status, "scheduled"),
          gte(worldCupMatches.scheduledTime, now)
        )
      )
      .orderBy(worldCupMatches.scheduledTime)
      .limit(limit);
  } catch (error) {
    console.error("[Database] Failed to get upcoming matches:", error);
    return [];
  }
}

export async function getMatchesByStage(stage: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get matches by stage: database not available");
    return [];
  }

  try {
    return await db
      .select()
      .from(worldCupMatches)
      .where(eq(worldCupMatches.stage, stage as any))
      .orderBy(worldCupMatches.scheduledTime);
  } catch (error) {
    console.error("[Database] Failed to get matches by stage:", error);
    return [];
  }
}

export async function getQualityVariants(matchId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get quality variants: database not available");
    return [];
  }

  try {
    return await db
      .select()
      .from(streamQualityVariants)
      .where(
        and(
          eq(streamQualityVariants.matchId, matchId),
          eq(streamQualityVariants.isAvailable, 1)
        )
      )
      .orderBy(desc(streamQualityVariants.quality));
  } catch (error) {
    console.error("[Database] Failed to get quality variants:", error);
    return [];
  }
}

export async function getBroadcastRights(country: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get broadcast rights: database not available");
    return undefined;
  }

  try {
    const result = await db
      .select()
      .from(broadcastRights)
      .where(eq(broadcastRights.country, country))
      .limit(1);

    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get broadcast rights:", error);
    return undefined;
  }
}
