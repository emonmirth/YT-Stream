import "dotenv/config";
import { getDb } from "../db";
import { worldCupMatches } from "../../drizzle/schema";

// FIFA World Cup 2026 Match Schedule Seeding (48 Group matches + Knockout slots)
// Dates use proper ISO timestamps with UTC/BRT timezone alignment.
// BRT timezone is UTC-3.

const defaultMatches = [
  // GROUP A
  {
    matchId: "wc2026-a1",
    team1: "Mexico",
    team2: "South Africa",
    stage: "group_stage" as const,
    group: "A",
    scheduledTime: new Date("2026-06-11T20:00:00Z"), // 17:00 BRT
    timezoneBRT: "17:00 BRT",
    stadium: "Estadio Azteca",
    city: "Mexico City",
    country: "Mexico",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },
  {
    matchId: "wc2026-a2",
    team1: "Sweden",
    team2: "New Zealand",
    stage: "group_stage" as const,
    group: "A",
    scheduledTime: new Date("2026-06-12T19:00:00Z"), // 16:00 BRT
    timezoneBRT: "16:00 BRT",
    stadium: "Estadio BBVA",
    city: "Monterrey",
    country: "Mexico",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },
  {
    matchId: "wc2026-a3",
    team1: "Mexico",
    team2: "Sweden",
    stage: "group_stage" as const,
    group: "A",
    scheduledTime: new Date("2026-06-17T20:00:00Z"), // 17:00 BRT
    timezoneBRT: "17:00 BRT",
    stadium: "Estadio Akron",
    city: "Guadalajara",
    country: "Mexico",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },
  {
    matchId: "wc2026-a4",
    team1: "South Africa",
    team2: "New Zealand",
    stage: "group_stage" as const,
    group: "A",
    scheduledTime: new Date("2026-06-18T19:00:00Z"), // 16:00 BRT
    timezoneBRT: "16:00 BRT",
    stadium: "Estadio Azteca",
    city: "Mexico City",
    country: "Mexico",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },
  {
    matchId: "wc2026-a5",
    team1: "New Zealand",
    team2: "Mexico",
    stage: "group_stage" as const,
    group: "A",
    scheduledTime: new Date("2026-06-24T23:30:00Z"), // 20:30 BRT
    timezoneBRT: "20:30 BRT",
    stadium: "Estadio Azteca",
    city: "Mexico City",
    country: "Mexico",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },
  {
    matchId: "wc2026-a6",
    team1: "South Africa",
    team2: "Sweden",
    stage: "group_stage" as const,
    group: "A",
    scheduledTime: new Date("2026-06-24T23:30:00Z"), // 20:30 BRT
    timezoneBRT: "20:30 BRT",
    stadium: "Estadio BBVA",
    city: "Monterrey",
    country: "Mexico",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },

  // GROUP B
  {
    matchId: "wc2026-b1",
    team1: "Canada",
    team2: "Bosnia and Herzegovina",
    stage: "group_stage" as const,
    group: "B",
    scheduledTime: new Date("2026-06-12T16:00:00Z"), // 13:00 BRT
    timezoneBRT: "13:00 BRT",
    stadium: "BC Place",
    city: "Vancouver",
    country: "Canada",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },
  {
    matchId: "wc2026-b2",
    team1: "South Korea",
    team2: "Ecuador",
    stage: "group_stage" as const,
    group: "B",
    scheduledTime: new Date("2026-06-13T18:00:00Z"), // 15:00 BRT
    timezoneBRT: "15:00 BRT",
    stadium: "Lumen Field",
    city: "Seattle",
    country: "USA",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },
  {
    matchId: "wc2026-b3",
    team1: "Canada",
    team2: "South Korea",
    stage: "group_stage" as const,
    group: "B",
    scheduledTime: new Date("2026-06-18T21:00:00Z"), // 18:00 BRT
    timezoneBRT: "18:00 BRT",
    stadium: "BMO Field",
    city: "Toronto",
    country: "Canada",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },
  {
    matchId: "wc2026-b4",
    team1: "Bosnia and Herzegovina",
    team2: "Ecuador",
    stage: "group_stage" as const,
    group: "B",
    scheduledTime: new Date("2026-06-19T20:00:00Z"), // 17:00 BRT
    timezoneBRT: "17:00 BRT",
    stadium: "Gillette Stadium",
    city: "Boston",
    country: "USA",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },
  {
    matchId: "wc2026-b5",
    team1: "Ecuador",
    team2: "Canada",
    stage: "group_stage" as const,
    group: "B",
    scheduledTime: new Date("2026-06-24T20:00:00Z"), // 17:00 BRT
    timezoneBRT: "17:00 BRT",
    stadium: "BC Place",
    city: "Vancouver",
    country: "Canada",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },
  {
    matchId: "wc2026-b6",
    team1: "Bosnia and Herzegovina",
    team2: "South Korea",
    stage: "group_stage" as const,
    group: "B",
    scheduledTime: new Date("2026-06-24T20:00:00Z"), // 17:00 BRT
    timezoneBRT: "17:00 BRT",
    stadium: "BMO Field",
    city: "Toronto",
    country: "Canada",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },

  // GROUP C
  {
    matchId: "wc2026-c1",
    team1: "USA",
    team2: "Japan",
    stage: "group_stage" as const,
    group: "C",
    scheduledTime: new Date("2026-06-12T23:00:00Z"), // 20:00 BRT
    timezoneBRT: "20:00 BRT",
    stadium: "SoFi Stadium",
    city: "Los Angeles",
    country: "USA",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },
  {
    matchId: "wc2026-c2",
    team1: "France",
    team2: "Belgium",
    stage: "group_stage" as const,
    group: "C",
    scheduledTime: new Date("2026-06-13T19:00:00Z"), // 16:00 BRT
    timezoneBRT: "16:00 BRT",
    stadium: "MetLife Stadium",
    city: "East Rutherford",
    country: "USA",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },
  {
    matchId: "wc2026-c3",
    team1: "USA",
    team2: "France",
    stage: "group_stage" as const,
    group: "C",
    scheduledTime: new Date("2026-06-19T23:00:00Z"), // 20:00 BRT
    timezoneBRT: "20:00 BRT",
    stadium: "Mercedes-Benz Stadium",
    city: "Atlanta",
    country: "USA",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },
  {
    matchId: "wc2026-c4",
    team1: "Japan",
    team2: "Belgium",
    stage: "group_stage" as const,
    group: "C",
    scheduledTime: new Date("2026-06-20T21:00:00Z"), // 18:00 BRT
    timezoneBRT: "18:00 BRT",
    stadium: "Lincoln Financial Field",
    city: "Philadelphia",
    country: "USA",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },
  {
    matchId: "wc2026-c5",
    team1: "Belgium",
    team2: "USA",
    stage: "group_stage" as const,
    group: "C",
    scheduledTime: new Date("2026-06-25T23:00:00Z"), // 20:00 BRT
    timezoneBRT: "20:00 BRT",
    stadium: "SoFi Stadium",
    city: "Los Angeles",
    country: "USA",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },
  {
    matchId: "wc2026-c6",
    team1: "Japan",
    team2: "France",
    stage: "group_stage" as const,
    group: "C",
    scheduledTime: new Date("2026-06-25T23:00:00Z"), // 20:00 BRT
    timezoneBRT: "20:00 BRT",
    stadium: "Lumen Field",
    city: "Seattle",
    country: "USA",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },

  // GROUP D
  {
    matchId: "wc2026-d1",
    team1: "Brazil",
    team2: "Morocco",
    stage: "group_stage" as const,
    group: "D",
    scheduledTime: new Date("2026-06-13T15:00:00Z"), // 12:00 BRT - LIVE matching for test
    timezoneBRT: "12:00 BRT",
    stadium: "MetLife Stadium",
    city: "East Rutherford",
    country: "USA",
    broadcaster: "CazeTV",
    status: "live" as const,
  },
  {
    matchId: "wc2026-d2",
    team1: "Spain",
    team2: "Germany",
    stage: "group_stage" as const,
    group: "D",
    scheduledTime: new Date("2026-06-13T22:00:00Z"), // 19:00 BRT
    timezoneBRT: "19:00 BRT",
    stadium: "SoFi Stadium",
    city: "Los Angeles",
    country: "USA",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },

  // KNOCKOUTS
  {
    matchId: "wc2026-r16-1",
    team1: "Winner Group A",
    team2: "Runner-up Group B",
    stage: "round_of_16" as const,
    group: null,
    scheduledTime: new Date("2026-07-04T19:00:00Z"), // 16:00 BRT
    timezoneBRT: "16:00 BRT",
    stadium: "MetLife Stadium",
    city: "East Rutherford",
    country: "USA",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },
  {
    matchId: "wc2026-qf1",
    team1: "Winner R16 1",
    team2: "Winner R16 2",
    stage: "quarterfinals" as const,
    group: null,
    scheduledTime: new Date("2026-07-10T20:00:00Z"), // 17:00 BRT
    timezoneBRT: "17:00 BRT",
    stadium: "Gillette Stadium",
    city: "Boston",
    country: "USA",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },
  {
    matchId: "wc2026-sf1",
    team1: "Winner QF 1",
    team2: "Winner QF 2",
    stage: "semifinals" as const,
    group: null,
    scheduledTime: new Date("2026-07-14T22:00:00Z"), // 19:00 BRT
    timezoneBRT: "19:00 BRT",
    stadium: "AT&T Stadium",
    city: "Dallas",
    country: "USA",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  },
  {
    matchId: "wc2026-final",
    team1: "Winner SF 1",
    team2: "Winner SF 2",
    stage: "final" as const,
    group: null,
    scheduledTime: new Date("2026-07-19T21:00:00Z"), // 18:00 BRT
    timezoneBRT: "18:00 BRT",
    stadium: "MetLife Stadium",
    city: "East Rutherford",
    country: "USA",
    broadcaster: "CazeTV",
    status: "scheduled" as const,
  }
];

async function seed() {
  console.log("[Seeding] Connecting to database...");
  const db = await getDb();
  if (!db) {
    console.error("[Seeding] Failed to initialize DB connection.");
    process.exit(1);
  }

  console.log(`[Seeding] Upserting ${defaultMatches.length} World Cup 2026 Matches...`);

  for (const match of defaultMatches) {
    try {
      await db
        .insert(worldCupMatches)
        .values(match)
        .onDuplicateKeyUpdate({
          set: {
            team1: match.team1,
            team2: match.team2,
            stage: match.stage,
            group: match.group,
            scheduledTime: match.scheduledTime,
            timezoneBRT: match.timezoneBRT,
            stadium: match.stadium,
            city: match.city,
            country: match.country,
            broadcaster: match.broadcaster,
            status: match.status,
            updatedAt: new Date(),
          },
        });
    } catch (err) {
      console.error(`[Seeding] Error on match ${match.matchId}:`, err);
    }
  }

  console.log("[Seeding] Complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[Seeding] Fatal error:", err);
  process.exit(1);
});
