interface ContactPayload {
  name?: string;
  email?: string;
  company?: string;
  budget?: string;
  message?: string;
  /** honeypot — must stay empty */
  website?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  if (!EMAIL_RE.test(email)) errors.email = "Please enter a valid email.";
  if (message.length < 10)
    errors.message = "Tell us a little more (at least 10 characters).";

  if (Object.keys(errors).length) {
    throw createError({
      statusCode: 422,
      statusMessage: "Validation failed",
      data: { errors },
    });
  }

  const id = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const lead = {
    id,
    name,
    email,
    company: body?.company?.trim() || null,
    budget: body?.budget?.trim() || null,
    message,
    receivedAt: new Date().toISOString(),
  };

  await useStorage("leads").setItem(id, lead);

  return {
    ok: true,
    id,
    message: `Thanks ${name.split(" ")[0]}! We'll be in touch within one business day.`,
  };
});
