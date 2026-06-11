interface ChangeRequestPayload {
  title?: string;
  details?: string;
  siteId?: string;
}

/**
 * POST /api/account/change-request (WebForgePlan2 §4.5)
 *
 * A signed-in customer submits a change/feature request. Stored as a
 * `change_requests` row; an admin later scopes + quotes it and debits the
 * wallet. Also alerts the admin inbox.
 */
export default defineEventHandler(async (event) => {
  const identity = await requireCustomer(event);
  const customer = await resolveCustomer(identity, { createIfMissing: true });
  if (!customer) {
    throw createError({
      statusCode: 404,
      statusMessage: "No customer record.",
    });
  }

  const body = await readBody<ChangeRequestPayload>(event);
  const title = body?.title?.trim() ?? "";
  const details = body?.details?.trim() ?? "";

  if (title.length < 3 || details.length < 10) {
    throw createError({
      statusCode: 422,
      statusMessage: "Please give a short title and a few sentences of detail.",
    });
  }

  const db = useDb();
  const [row] = await db
    .insert(schema.changeRequests)
    .values({
      customerId: customer.id,
      siteId: body?.siteId ?? null,
      title,
      details,
    })
    .returning({ id: schema.changeRequests.id });

  // Alert the admin inbox (best-effort; never blocks the response).
  const admin = getMailAdmin();
  if (admin) {
    void sendEmail({
      to: admin,
      replyTo: customer.email,
      subject: `Change request from ${customer.name}: ${title}`,
      html: `<p><strong>${customer.name}</strong> (${customer.email}) submitted a change request.</p><p><strong>${title}</strong></p><p style="white-space:pre-wrap">${details}</p>`,
      text: `${customer.name} (${customer.email}) submitted a change request.\n\n${title}\n\n${details}`,
    });
  }

  return { ok: true, id: row?.id };
});
