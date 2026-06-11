/**
 * Transactional email templates (plan §1, Phase 1).
 *
 * Plain, inline-styled HTML so it renders consistently across mail clients
 * (Gmail, Outlook, Apple Mail) — external stylesheets and <style> blocks are
 * unreliable in email, so everything is inlined.
 *
 * Each builder returns `{ subject, html, text }`. The `text` part is a plain
 * fallback for clients that don't render HTML and helps deliverability.
 */

const BRAND = "TheWebsiteForge";
const ACCENT = "#14b88a";
const BG = "#05070d";
const CARD = "#0c1018";
const TEXT = "#e6edf3";
const MUTED = "#9aa7b2";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/** Escape user-supplied text before interpolating it into HTML. */
function esc(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Shared shell: dark card on a dark background, centered, max 560px. */
function layout(bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${CARD};border-radius:16px;overflow:hidden;border:1px solid #1b2230;">
        <tr><td style="padding:28px 32px 8px 32px;">
          <span style="font:700 18px/1.2 'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${TEXT};">The<span style="color:${ACCENT};">WebsiteForge</span></span>
        </td></tr>
        <tr><td style="padding:8px 32px 32px 32px;font:400 15px/1.6 'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${TEXT};">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:18px 32px;border-top:1px solid #1b2230;font:400 12px/1.5 'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${MUTED};">
          ${esc(BRAND)} · This is an automated message, but you can reply to it and a human will read it.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${esc(href)}" style="display:inline-block;background:${ACCENT};color:#04130d;text-decoration:none;font-weight:600;padding:11px 20px;border-radius:10px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${esc(label)}</a>`;
}

/* ------------------------------ leads ------------------------------ */

/** Confirmation sent to a lead after they submit the contact form. */
export function leadConfirmationEmail(input: { name: string }): EmailContent {
  const first = input.name.split(" ")[0] || "there";
  const subject = `Thanks for reaching out to ${BRAND}`;
  const html = layout(`
    <h1 style="margin:0 0 14px 0;font-size:20px;color:${TEXT};">Thanks, ${esc(first)} 👋</h1>
    <p style="margin:0 0 14px 0;">We've got your message and we'll get back to you within <strong>one business day</strong>.</p>
    <p style="margin:0 0 14px 0;">In the meantime, if you think of anything else you'd like us to know, just reply to this email and it'll reach us directly.</p>
    <p style="margin:18px 0 0 0;color:${MUTED};">— The ${esc(BRAND)} team</p>
  `);
  const text = `Thanks, ${first}!\n\nWe've got your message and we'll get back to you within one business day.\n\nIf you think of anything else, just reply to this email.\n\n— The ${BRAND} team`;
  return { subject, html, text };
}

/** Alert sent to the admin inbox when a new lead arrives. */
export function leadAlertEmail(input: {
  name: string;
  email: string;
  company?: string | null;
  budget?: string | null;
  message: string;
}): EmailContent {
  const subject = `New lead: ${input.name}${input.company ? ` (${input.company})` : ""}`;
  const rows: Array<[string, string]> = [
    ["Name", input.name],
    ["Email", input.email],
    ["Company", input.company || "—"],
    ["Budget", input.budget || "—"],
  ];
  const rowsHtml = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:${MUTED};white-space:nowrap;">${esc(k)}</td><td style="padding:4px 0;color:${TEXT};">${esc(v)}</td></tr>`,
    )
    .join("");
  const html = layout(`
    <h1 style="margin:0 0 14px 0;font-size:20px;color:${TEXT};">New lead from the contact form</h1>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;font-size:14px;">${rowsHtml}</table>
    <p style="margin:0 0 6px 0;color:${MUTED};">Message</p>
    <div style="background:#070a11;border:1px solid #1b2230;border-radius:10px;padding:14px;white-space:pre-wrap;color:${TEXT};">${esc(input.message)}</div>
  `);
  const text = `New lead from the contact form\n\nName: ${input.name}\nEmail: ${input.email}\nCompany: ${input.company || "—"}\nBudget: ${input.budget || "—"}\n\nMessage:\n${input.message}`;
  return { subject, html, text };
}

/* ----------------------------- billing ----------------------------- */

/** Receipt sent to a customer after a successful payment. */
export function receiptEmail(input: {
  name?: string | null;
  description: string;
  amountCents: number;
  currency: string;
  reference: string;
}): EmailContent {
  const first = (input.name ?? "").split(" ")[0] || "there";
  const amount = formatMoney(input.amountCents, input.currency);
  const subject = `Your ${BRAND} receipt — ${amount}`;
  const html = layout(`
    <h1 style="margin:0 0 14px 0;font-size:20px;color:${TEXT};">Payment received ✅</h1>
    <p style="margin:0 0 14px 0;">Thanks, ${esc(first)} — we've received your payment. Here are the details:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;font-size:14px;">
      <tr><td style="padding:4px 12px 4px 0;color:${MUTED};">Item</td><td style="padding:4px 0;color:${TEXT};">${esc(input.description)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:${MUTED};">Amount</td><td style="padding:4px 0;color:${TEXT};font-weight:600;">${esc(amount)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:${MUTED};">Reference</td><td style="padding:4px 0;color:${TEXT};">${esc(input.reference)}</td></tr>
    </table>
    <p style="margin:0;color:${MUTED};">Keep this email for your records. Reply if you have any questions.</p>
  `);
  const text = `Payment received\n\nThanks, ${first}!\n\nItem: ${input.description}\nAmount: ${amount}\nReference: ${input.reference}\n\nKeep this email for your records.`;
  return { subject, html, text };
}

/** Dunning email when a recurring charge fails. */
export function paymentFailedEmail(input: {
  name?: string | null;
  manageUrl?: string | null;
}): EmailContent {
  const first = (input.name ?? "").split(" ")[0] || "there";
  const subject = `Action needed: your ${BRAND} payment didn't go through`;
  const cta = input.manageUrl
    ? `<p style="margin:18px 0;">${button(input.manageUrl, "Update payment method")}</p>`
    : `<p style="margin:18px 0;">Please reply to this email and we'll send you a secure link to update your card.</p>`;
  const html = layout(`
    <h1 style="margin:0 0 14px 0;font-size:20px;color:${TEXT};">We couldn't process your payment</h1>
    <p style="margin:0 0 14px 0;">Hi ${esc(first)}, your most recent subscription charge didn't go through. This usually means the card expired or had insufficient funds.</p>
    <p style="margin:0 0 6px 0;">To avoid any interruption to your site, please update your payment method:</p>
    ${cta}
    <p style="margin:0;color:${MUTED};">If you've already fixed this, you can ignore this message.</p>
  `);
  const text = `We couldn't process your payment\n\nHi ${first}, your most recent subscription charge didn't go through.\n\n${input.manageUrl ? `Update your payment method: ${input.manageUrl}` : "Reply to this email and we'll send you a secure link to update your card."}`;
  return { subject, html, text };
}

/* ------------------------------ wallet ----------------------------- */

/** Receipt sent after a successful wallet top-up. */
export function walletTopupEmail(input: {
  name?: string | null;
  amountCents: number; // USD cents added
  balanceAfterCents: number; // USD cents
  reference: string;
}): EmailContent {
  const first = (input.name ?? "").split(" ")[0] || "there";
  const added = formatMoney(input.amountCents, "USD");
  const balance = formatMoney(input.balanceAfterCents, "USD");
  const subject = `Your ${BRAND} wallet was topped up — ${added}`;
  const html = layout(`
    <h1 style="margin:0 0 14px 0;font-size:20px;color:${TEXT};">Top-up received ✅</h1>
    <p style="margin:0 0 14px 0;">Thanks, ${esc(first)} — we've added <strong>${esc(added)}</strong> to your wallet.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;font-size:14px;">
      <tr><td style="padding:4px 12px 4px 0;color:${MUTED};">Added</td><td style="padding:4px 0;color:${TEXT};font-weight:600;">${esc(added)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:${MUTED};">New balance</td><td style="padding:4px 0;color:${TEXT};font-weight:600;">${esc(balance)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:${MUTED};">Reference</td><td style="padding:4px 0;color:${TEXT};">${esc(input.reference)}</td></tr>
    </table>
    <p style="margin:0;color:${MUTED};">Your monthly hosting and any work you request are drawn from this balance. Credit never expires.</p>
  `);
  const text = `Top-up received\n\nThanks, ${first}! We've added ${added} to your wallet.\n\nNew balance: ${balance}\nReference: ${input.reference}\n\nYour monthly hosting and requested work are drawn from this balance. Credit never expires.`;
  return { subject, html, text };
}

/** Warning when the wallet can't cover the next monthly charge. */
export function lowBalanceEmail(input: {
  name?: string | null;
  balanceCents: number; // USD cents
  serviceLabel: string;
  chargeCents: number; // USD cents needed
  graceDays: number;
  topupUrl?: string | null;
}): EmailContent {
  const first = (input.name ?? "").split(" ")[0] || "there";
  const balance = formatMoney(input.balanceCents, "USD");
  const needed = formatMoney(input.chargeCents, "USD");
  const subject = `Action needed: low ${BRAND} wallet balance`;
  const cta = input.topupUrl
    ? `<p style="margin:18px 0;">${button(input.topupUrl, "Add funds")}</p>`
    : "";
  const html = layout(`
    <h1 style="margin:0 0 14px 0;font-size:20px;color:${TEXT};">Your wallet is running low</h1>
    <p style="margin:0 0 14px 0;">Hi ${esc(first)}, we couldn't cover your latest charge for <strong>${esc(input.serviceLabel)}</strong> (${esc(needed)}) — your wallet balance is ${esc(balance)}.</p>
    <p style="margin:0 0 6px 0;">Please top up within <strong>${input.graceDays} days</strong> to keep your site online. After that we may need to suspend it until the balance is restored.</p>
    ${cta}
    <p style="margin:0;color:${MUTED};">Already topped up? You can ignore this message.</p>
  `);
  const text = `Your wallet is running low\n\nHi ${first}, we couldn't cover your latest charge for ${input.serviceLabel} (${needed}). Balance: ${balance}.\n\nPlease top up within ${input.graceDays} days to keep your site online.${input.topupUrl ? `\n\nAdd funds: ${input.topupUrl}` : ""}`;
  return { subject, html, text };
}

/** Notice that a site was suspended after the grace window with an empty wallet. */
export function suspensionEmail(input: {
  name?: string | null;
  siteName?: string | null;
  topupUrl?: string | null;
}): EmailContent {
  const first = (input.name ?? "").split(" ")[0] || "there";
  const site = input.siteName || "your site";
  const subject = `${BRAND}: ${site} has been suspended`;
  const cta = input.topupUrl
    ? `<p style="margin:18px 0;">${button(input.topupUrl, "Add funds to restore")}</p>`
    : "";
  const html = layout(`
    <h1 style="margin:0 0 14px 0;font-size:20px;color:${TEXT};">${esc(site)} has been suspended</h1>
    <p style="margin:0 0 14px 0;">Hi ${esc(first)}, because the wallet balance stayed empty through the grace period, we've temporarily suspended <strong>${esc(site)}</strong>.</p>
    <p style="margin:0 0 6px 0;">Top up your wallet and we'll restore it right away — no data is lost.</p>
    ${cta}
    <p style="margin:0;color:${MUTED};">Questions? Just reply to this email.</p>
  `);
  const text = `${site} has been suspended\n\nHi ${first}, because your wallet balance stayed empty through the grace period, we've temporarily suspended ${site}.\n\nTop up your wallet and we'll restore it right away — no data is lost.${input.topupUrl ? `\n\nAdd funds: ${input.topupUrl}` : ""}`;
  return { subject, html, text };
}

/* ----------------------------- helpers ----------------------------- */

/** Format integer minor units (cents/kobo) as a currency string. */
export function formatMoney(amountCents: number, currency: string): string {
  const major = amountCents / 100;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(major);
  } catch {
    // Unknown currency code — fall back to a plain number + code.
    return `${major.toFixed(2)} ${currency.toUpperCase()}`;
  }
}
