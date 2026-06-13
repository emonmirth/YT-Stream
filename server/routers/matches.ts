import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { 
  getAllMatches, 
  getLiveMatches, 
  getUpcomingMatches, 
  getDb 
} from "../db";
import { worldCupMatches } from "../../drizzle/schema";

export const matchesRouter = router({
  /**
   * Get all matches in the tournament schedule
   */
  getAll: publicProcedure.query(async () => {
    return await getAllMatches();
  }),

  /**
   * Get all currently live matches
   */
  getLive: publicProcedure.query(async () => {
    return await getLiveMatches();
  }),

  /**
   * Get upcoming matches
   */
  getUpcoming: publicProcedure
    .input(z.object({
      limit: z.number().optional().default(10),
    }))
    .query(async ({ input }) => {
      return await getUpcomingMatches(input.limit);
    }),
});
