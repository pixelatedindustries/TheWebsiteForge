/**
 * Audit log helper (WebForgePlan2 §5). Writes one row per admin mutation so
 * there's a record of who did what. Best-effort: a logging failure must never
 * break the action that triggered it.
 */
export async function writeAudit(
  adminEmail: string,
  action: string,
  target?: string | null,
): Promise<void> {
  try {
    const db = useDb();
    await db.insert(schema.auditLog).values({
      adminEmail,
      action,
      target: target ?? null,
    });
  } catch (err) {
    console.error("[audit] failed to write audit row:", err);
  }
}
