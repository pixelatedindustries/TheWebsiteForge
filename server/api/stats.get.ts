import { stats, projects } from "../../shared/site";

/**
 * GET /api/stats
 * Returns headline stats plus a couple of values derived live from the
 * project catalogue, so the homepage figures stay in sync with the data.
 */
export default defineEventHandler(() => {
  const available = projects.filter((p) => p.status === "Available").length;
  const sold = projects.filter((p) => p.status === "Sold").length;

  return {
    stats,
    catalogue: {
      total: projects.length,
      available,
      sold,
    },
  };
});
