import { isValidEmail } from "../../../shared/validation";
import { getBuildPackage } from "../../../shared/billing";

interface BriefPayload {
  email?: string;
  planKey?: string;
  answers?: Record<string, unknown>;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<BriefPayload>(event);
  const email = body?.email?.trim().toLowerCase() ?? "";
  const planKey = body?.planKey?.trim() ?? "";
  const answers = body?.answers;

  if (!isValidEmail(email) || !getBuildPackage(planKey) || !answers) {
    throw createError({
      statusCode: 422,
      statusMessage: "A valid email, plan, and project brief are required.",
    });
  }

  const [brief] = await useDb()
    .insert(schema.checkoutBriefs)
    .values({ email, planKey, answers })
    .returning({ id: schema.checkoutBriefs.id });

  if (!brief) {
    throw createError({
      statusCode: 500,
      statusMessage: "Could not save project brief.",
    });
  }

  return { id: brief.id };
});
