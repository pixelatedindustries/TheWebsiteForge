import { projects, type ProjectCategory } from "../../shared/site";

/**
 * GET /api/projects
 * Optional query params:
 *   ?category=SaaS   — filter by category
 *   ?status=Sold     — filter by availability status
 */
export default defineEventHandler((event) => {
  const { category, status } = getQuery(event);

  let result = [...projects];

  if (category && category !== "All") {
    result = result.filter((p) => p.category === (category as ProjectCategory));
  }
  if (status) {
    result = result.filter((p) => p.status === status);
  }

  return {
    count: result.length,
    projects: result,
  };
});
