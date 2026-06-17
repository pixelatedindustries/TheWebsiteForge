import { isValidEmail } from "../../shared/validation";
import type { ContactPayload } from "../models/contact";

/**
 * POST /api/contact
 * Validates a lead and persists it to file-backed Nitro storage (./.data/leads).
 * Swap the storage write for an email/CRM call in production.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<ContactPayload>(event);

  // Honeypot: silently accept bots without storing anything.
  if (body?.website) {
    return { ok: true, id: "ignored" };
  }

  const name = body?.name?.trim() ?? "";
  const email = body?.email?.trim() ?? "";
  const message = body?.message?.trim() ?? "";

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Please enter your name.";
  if (name.length > 120) errors.name = "That name is too long.";
  if (!isValidEmail(email)) errors.email = "Please enter a valid email.";
  if (message.length < 10)
    errors.message = "Tell us a little more (at least 10 characters).";
  if (message.length > 5000)
    errors.message = "That message is too long (5000 characters max).";
  if ((body?.company?.trim().length ?? 0) > 200)
    errors.company = "That company name is too long.";
  if ((body?.budget?.trim().length ?? 0) > 100)
    errors.budget = "That budget value is too long.";

  if (Object.keys(errors).length) {
    throw createError({
      statusCode: 422,
      statusMessage: "Validation failed",
      data: { errors },
    });
  }

  const id = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const company = body?.company?.trim() || null;
  const budget = body?.budget?.trim() || null;
  const lead = {
    id,
    name,
    email,
    company,
    budget,
    message,
    receivedAt: new Date().toISOString(),
  };

  // Primary store: PostgreSQL `leads` table (shown in the admin inbox).
  // Falls back to file-backed Nitro storage if the DB is unavailable, so a
  // submission is never silently lost in local dev.
  let leadId = id;
  try {
    const db = useDb();
    const [row] = await db
      .insert(schema.leads)
      .values({ name, email, company, budget, message, source: "contact_form" })
      .returning({ id: schema.leads.id });
    leadId = row?.id ?? id;
  } catch (err) {
    console.error(
      "[contact] DB insert failed, falling back to file storage:",
      err,
    );
    await useStorage("leads").setItem(id, lead);
  }

  // Fire transactional emails (Phase 1): an alert to the admin inbox and a
  // confirmation to the lead. sendEmail never throws, so a mail failure can't
  // lose the lead we just stored — we don't block the response on it either.
  const admin = getMailAdmin();
  if (admin) {
    const alert = leadAlertEmail({ name, email, company, budget, message });
    void sendEmail({ to: admin, replyTo: email, ...alert });
  }
  const confirmation = leadConfirmationEmail({ name });
  void sendEmail({ to: email, ...confirmation });

  return {
    ok: true,
    id: leadId,
    message: `Thanks ${name.split(" ")[0]}! We'll be in touch within one business day.`,
  };
});
