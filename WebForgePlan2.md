# WebForgePlan2 — Current-State Audit + The Credit-Wallet Model + Full Go-Live Plan

> **What this document is.** A from-scratch re-evaluation of TheWebsiteForge as it
> _actually_ stands in the codebase today (verified file-by-file), a candid assessment of
> your proposed **prepaid credit-wallet** billing model, and then a single, ordered,
> **step-by-step** path to a fully working business — including exactly what to click in
> **Paystack** and **Resend**, and how to settle **pricing**.
>
> **Scope (unchanged from the original plan):**
>
> - **Cloudflare / domains automation is EXCLUDED** per your instruction. (You'll handle
>   DNS + domain registration manually for now.)
> - **Hosting/deployment is out of scope** — the plan ends at "production-ready & configured".
> - This supersedes the build-order in [TheWebsiteForgePlan.md](TheWebsiteForgePlan.md).
>   That file stays valid for the Paystack/Resend account setup write-ups; this file is the
>   active plan and adapts everything to the **wallet model**.

---

## 0. TL;DR — the headline calls

1. **Adopt the credit-wallet model. ✅** It's a _better_ fit for you than card subscriptions
   — it removes the single most fragile part of the whole system (Paystack recurring Plans,
   card-on-file renewals, failed-payment dunning). See [§3](#3-the-credit-wallet-model--honest-evaluation)
   for the honest pros/cons. There are a few real things to handle (a proper ledger, a
   low-balance/suspension policy, and deferred-revenue accounting) but **none are blockers**.
2. **You're further along than the original plan assumes.** Phase 1 (email) and the Phase 2
   payment _scaffolding_ are **already built and compiling**. See [§2](#2-current-state--verified-audit).
3. **The wallet model means you do NOT need Paystack Plans.** Top-ups are plain one-time
   charges — much simpler. The `PAYSTACK_PLAN_*` env vars become unnecessary.
4. **Display in USD, charge in ZAR (DECIDED — "Option A").** The public site, prices, and
   the wallet are all denominated in **USD** (your global audience recognises it); at the
   moment of payment we convert to **ZAR** using a configurable rate and charge that via
   Paystack (which settles in ZAR). The customer always sees the exact ZAR amount before
   paying. See [§7](#7-pricing--display-usd-charge-zar).

---

## 1. How the money flows (the new mental model)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ONE-OFF (charged normally, NOT from wallet)                          │
│   • Website build (Starter / Business / Custom)                       │
│   • Big one-time project work                                         │
│        → normal Paystack one-time charge → invoice marked paid        │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│  THE WALLET (prepaid credit in USD, never expires)                    │
│                                                                       │
│   Customer tops up $500 ──Paystack charges the ZAR equiv.──▶ +$500    │
│                          (e.g. R9,500 at the configured rate)         │
│                                                                       │
│   Then everything recurring / ad-hoc is DEBITED from the balance:     │
│     • Monthly hosting fee        (auto, scheduled)   — in USD         │
│       (includes baseline upkeep: security updates, backups, monitor) │
│     • Monthly database fee       (auto, scheduled)   — in USD         │
│     • Feature requests / changes (admin charges, ad-hoc) — in USD     │
│                                                                       │
│   Low balance → warn → grace period → suspend if it hits zero         │
└─────────────────────────────────────────────────────────────────────┘
```

The wallet replaces **Paystack subscriptions** with **(a)** simple top-ups + **(b)** your
own internal ledger + **(c)** a scheduled monthly "debit" job. You own the billing logic
end-to-end instead of trying to keep your DB in sync with Paystack's subscription state.

**Currency (Option A):** everything the customer sees and the wallet balance itself live in
**USD**. Paystack is only the **ZAR payment rail** used the instant a top-up happens — we
convert USD→ZAR at a configurable rate, charge that ZAR amount, and credit the USD amount to
the wallet. All monthly debits and feature charges are then pure internal USD math (no
Paystack, no FX, until the next top-up). See [§7](#7-pricing--display-usd-charge-zar).

---

## 2. Current State — Verified Audit

I read the codebase directly. Here's the real picture (not the original plan's assumptions).

### 2.1 DONE and working ✅

| Area                                 | Evidence                                                                                                                                                                                                                                                                                                                                                                                     | Notes                                                                                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Marketing site**                   | `app/pages/*`                                                                                                                                                                                                                                                                                                                                                                                | home, about, pricing, showcase, contact, terms, hosting-agreement, refund-policy. Polished.                                                 |
| **DB schema (8 tables)**             | [server/database/schema.ts](server/database/schema.ts)                                                                                                                                                                                                                                                                                                                                       | customers, leads, sites, domains, subscriptions, invoices, admin_users, audit_log.                                                          |
| **Migrations**                       | `server/database/migrations/0000…`, `0001_tense_makkari.sql`                                                                                                                                                                                                                                                                                                                                 | `0001` adds `customers.paystack_customer_code` + sets sub provider default `paystack`. **Generated but NOT yet applied** (Docker was down). |
| **DB connection**                    | [server/utils/db.ts](server/utils/db.ts)                                                                                                                                                                                                                                                                                                                                                     | Drizzle + pg pool, `useDb()`.                                                                                                               |
| **Admin auth**                       | [server/utils/admin-auth.ts](server/utils/admin-auth.ts), [app/layouts/admin.vue](app/layouts/admin.vue)                                                                                                                                                                                                                                                                                     | Firebase Google + `ADMIN_EMAILS` allowlist; admin layout gates on `/api/admin/me`.                                                          |
| **Contact → DB**                     | [server/api/contact.post.ts](server/api/contact.post.ts)                                                                                                                                                                                                                                                                                                                                     | Writes leads, file fallback in dev.                                                                                                         |
| **Phase 1 — Email** ✅               | [server/utils/email.ts](server/utils/email.ts), [server/utils/email-templates.ts](server/utils/email-templates.ts)                                                                                                                                                                                                                                                                           | Resend wrapper (never throws), lead alert + confirmation wired into contact. Receipt + dunning templates ready.                             |
| **Phase 2 — Payment scaffolding** ✅ | [server/utils/paystack.ts](server/utils/paystack.ts), [server/api/checkout/create.post.ts](server/api/checkout/create.post.ts), [server/api/checkout/verify.get.ts](server/api/checkout/verify.get.ts), [server/api/webhooks/paystack.post.ts](server/api/webhooks/paystack.post.ts), [shared/billing.ts](shared/billing.ts), [server/utils/customer-auth.ts](server/utils/customer-auth.ts) | Hosted-checkout init, signed webhook (HMAC-SHA512, re-verify), customer auth helper. Build passes.                                          |
| **Account billing endpoints**        | [server/api/account/billing.get.ts](server/api/account/billing.get.ts), `account/subscription/{manage-link,cancel}.post.ts`                                                                                                                                                                                                                                                                  | Built for the _subscription_ model — will be **repurposed** for the wallet.                                                                 |
| **Checkout pages**                   | [app/pages/checkout/success.vue](app/pages/checkout/success.vue), `cancel.vue`                                                                                                                                                                                                                                                                                                               | Verify-before-confirm.                                                                                                                      |
| **Admin read dashboards**            | `app/pages/admin/*`, `server/api/admin/*.get.ts`                                                                                                                                                                                                                                                                                                                                             | overview/leads/customers/sites/domains/billing read real DB.                                                                                |
| **Lead pipeline mutation**           | [server/api/admin/leads.patch.ts](server/api/admin/leads.patch.ts)                                                                                                                                                                                                                                                                                                                           | new → contacted → won → lost.                                                                                                               |
| **Legal drafts**                     | `/terms`, `/hosting-agreement`, `/refund-policy`                                                                                                                                                                                                                                                                                                                                             | Drafts — still need lawyer review.                                                                                                          |

### 2.2 NOT done yet ❌ (the real gap list)

1. **Migration `0001` not applied** to the running DB (Docker Desktop was off).
2. **Wallet model — 0% built.** No wallet balance, no ledger, no top-up flow, no scheduled
   deductions, no low-balance handling. _(This is the new core — [§4](#4-the-wallet-build-plan-phase-by-phase).)_
3. **Public checkout not wired (Phase 3).** [app/components/PricingCard.vue](app/components/PricingCard.vue)
   CTAs still link to `/contact`; hosting/DB cards have **no buttons at all**. Nothing
   calls `/api/checkout/create`.
4. **Customer portal missing (Phase 4).** No `app/pages/account/*` pages exist. Customers
   can't sign in to see anything; only an admin login exists. No "change request" flow.
5. **Admin write-actions missing (Phase 5).** Only lead status is mutable. No convert-lead-
   to-customer, no customer/site/domain create-edit, no manual charge/credit, no `audit_log`
   writing, no DB-backed admin roster.
6. **Mock data still served.** [server/api/projects.get.ts](server/api/projects.get.ts) and
   [server/api/stats.get.ts](server/api/stats.get.ts) read from `shared/site.ts`, not the DB.
   (Fine for the showcase; just know it's not "real".)
7. **Currency handling (Option A) to build.** Public site shows **USD** (intended — global
   audience); Paystack charges **ZAR**. Need a USD→ZAR conversion at checkout, a configurable
   rate, and a USD-denominated wallet. The `currency` columns currently default to `USD`,
   which already matches the display side ([§7](#7-pricing--display-usd-charge-zar)).
8. **Hardening not started (Phase 7).** No `/privacy` page, no rate-limiting on public POST
   routes, secrets not rotated, still on Paystack **test** keys.
9. **Business/compliance.** Paystack activation, SA bank account, lawyer-reviewed legals.

---

## 3. The Credit-Wallet Model — Honest Evaluation

**Verdict: adopt it.** For _your_ situation (South Africa, Paystack, 3-person side business,
no revenue yet) it's genuinely more sustainable than card subscriptions. Here's the straight
assessment.

### 3.1 Why it's a good fit ✅

1. **It deletes the hardest, most fragile code.** Card-on-file recurring billing means
   Paystack Plans, subscription webhooks, renewal failures, card-expiry handling, and
   dunning — the part most likely to break or silently lose money. The wallet replaces all
   of that with **one-time top-ups** (rock-solid) + **your own ledger** (fully in your
   control).
2. **Paystack's one-time charges are its strongest, simplest surface.** You lean on what
   works best and avoid its weaker subscription tooling.
3. **Cash flow upfront.** A customer pre-paying a year improves your runway and reduces the
   number of Paystack transactions (and therefore total transaction fees).
4. **One balance, many uses.** Hosting + DB + ad-hoc feature work all draw from the
   same pot — no separate mandates per service. Adding a charge for "a change request" is
   trivial (debit the wallet); with subscriptions that's awkward.
5. **No surprise bank debits for the customer.** A real selling point you can market:
   _"top up once, we draw from it, no monthly card charges."_

### 3.2 The real complications (manageable, not blockers) ⚠️

1. **You must build a proper ledger.** Every credit (top-up, refund, adjustment) and debit
   (hosting, DB, feature) needs an immutable transaction row, and the balance must always
   equal the sum of the ledger. This is the main engineering you take on in exchange for
   dropping subscriptions. It's _simpler and more predictable_ than Paystack-sync, but it
   must be done carefully (see [§4.2](#42-phase-w1--wallet-foundation-schema--ledger)).
2. **Deferred-revenue accounting.** Money topped-up but not yet consumed is a **liability**
   (you owe service/refund), not earned income, until it's spent. For a pre-revenue side
   business this is minor, but tell your accountant you run a prepaid balance so revenue is
   recognised **on consumption**, not on top-up. _(Not tax advice — confirm with a SA
   practitioner.)_
3. **"Never expires" is a long-tail liability.** Customer-friendly and, in SA, actually
   _required_ to last a while: under the **Consumer Protection Act**, prepaid credit/vouchers
   generally **can't expire for at least 3 years**. "Never expires" exceeds that and is fine
   — just know unused balances sit on your books indefinitely, and decide your **refund
   stance** (recommended: _credit never expires; refunds of unused credit at our discretion,
   minus any transaction fees_ — spell it out in the Refund Policy).
4. **Low-balance / run-out policy.** When a wallet can't cover the next monthly debit you
   need: a **warning email**, a **grace period**, then **suspension**. This is "dunning",
   but on _your_ terms and far simpler than card-failure dunning.
5. **Transparency or disputes.** Customers must see every debit ("Hosting — March — −$45")
   and their running balance, or they'll query charges. The portal ledger ([§4.5](#45-phase-w4--customer-portal)) handles this.

### 3.3 What I'd explicitly recommend

- **Hybrid, exactly as you described:** one-off builds = normal Paystack charge; recurring +
  ad-hoc = wallet debits. ✅
- **No standalone care plans (DECIDED).** Fold baseline upkeep (security/dependency updates,
  backups, monitoring, minor tweaks) **into hosting**, and charge all bigger/extra work
  **ad-hoc** from the wallet. Fewer SKUs, and sites still stay patched (customers never
  request security updates themselves — so bundling it into hosting protects you both).
- **Credit never expires** (simple promise, CPA-friendly). Make it **non-refundable by
  default but transferable between the customer's own services**; allow goodwill refunds
  minus fees at your discretion.
- **Minimum top-up** (e.g. enough to cover ≥1 month of their hosting) so wallets don't start
  underwater.
- **Show "runway"** in the portal: _"Balance $285 · ~$45/mo · lasts ~6 months."_ Great UX,
  pushes timely top-ups.
- **Keep the one-time `invoices` system** you already have for builds; add the wallet as a
  parallel system for everything recurring/ad-hoc.

> **Bottom line:** the model is sound and _reduces_ total complexity versus subscriptions.
> The price you pay is building a clean ledger + a monthly debit job + a clear suspension
> policy. That's a good trade. Proceed.

---

## 4. The Wallet Build Plan (phase by phase)

These replace Phases 2–4 of the original plan. Each phase is independently shippable.

### 4.1 What changes vs. what you already built

| Already built                               | Fate under wallet model                                                                                                                                                                                               |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server/utils/paystack.ts`                  | **Keep.** Top-ups use `initializeTransaction` + `verifyTransaction`. The subscription helpers (`getSubscriptionManageLink`, `disableSubscription`, `getPlanCode`) become **unused** — leave them or delete later.     |
| `checkout/create.post.ts`                   | **Repurpose.** Add a `purpose: "topup" \| "build"` input. Top-up = arbitrary USD amount, converted to ZAR for the actual Paystack charge; build = one-off item. Drop the Paystack `plan` path.                        |
| `webhooks/paystack.post.ts`                 | **Simplify.** `charge.success` branches: top-up → **credit wallet** (in USD, from the metadata); build → mark invoice paid. The `subscription.*` / `invoice.*` handlers become **dormant** (harmless).                |
| `shared/billing.ts`                         | **Reshape** into a **rate card**: monthly service prices + one-off build prices, all in **USD** (display + wallet currency). Plus a configurable **USD→ZAR rate** used only at top-up. No Paystack Plan codes needed. |
| `account/billing.get.ts` + `subscription/*` | **Replace** with wallet endpoints (balance, ledger, top-up). Cancel/manage-card no longer apply (no cards stored).                                                                                                    |
| `PAYSTACK_PLAN_*` env vars                  | **Remove** — not needed without subscriptions.                                                                                                                                                                        |
| Paystack **Plans** dashboard setup          | **Skip entirely.**                                                                                                                                                                                                    |

### 4.2 Phase W1 — Wallet foundation (schema + ledger)

**Schema additions** (new migration):

- `customers.wallet_balance_cents` — `integer NOT NULL DEFAULT 0` (cached **USD-cents**
  balance; the ledger is the source of truth, this is a fast read).
- New enum `wallet_txn_type`: `topup`, `hosting`, `database`, `feature`, `change`,
  `refund`, `adjustment`.
- New table **`wallet_transactions`** (the ledger — append-only):
  - `id` uuid pk
  - `customer_id` → customers (cascade)
  - `type` `wallet_txn_type`
  - `amount_cents` integer — **signed USD cents**: positive = credit, negative = debit
  - `balance_after_cents` integer — snapshot of the USD balance immediately after this row
  - `currency` text default `USD` — the wallet's denomination
  - `charged_zar_cents` integer null — for top-ups, the actual ZAR amount Paystack charged
  - `fx_rate` text null — for top-ups, the USD→ZAR rate used (audit trail)
  - `description` text — human label shown in the portal
  - `reference` text null — Paystack ref for top-ups; null for internal debits
  - `site_id` uuid null — optional link to the site a charge relates to
  - `created_by` text — admin email, or `system` for the scheduled job
  - `created_at` timestamptz default now
- New table **`recurring_charges`** (what to auto-debit each month):
  - `id`, `customer_id`, `site_id` null
  - `kind` (`hosting` | `database`)
  - `label` text (e.g. "Dynamic Hosting")
  - `amount_cents` integer (**USD**), `interval` (`month`)
  - `status` (`active` | `paused` | `canceled`)
  - `next_charge_at` timestamptz
  - `created_at`
    _(You could overload the existing `subscriptions` table with `provider='wallet'`, but a
    dedicated table is clearer and avoids confusing it with Paystack subs.)_

**Server util `server/utils/wallet.ts`** — the only place that mutates balances, so the
ledger and the cached balance can never drift. **All amounts are USD cents:**

- `getBalance(customerId)` → reads `customers.wallet_balance_cents` (USD cents).
- `credit({ customerId, type, amountCents, description, reference, createdBy, chargedZarCents?, fxRate? })`
  → in a **DB transaction**: insert a `wallet_transactions` row, increment
  `wallet_balance_cents`, write `balance_after_cents`.
- `debit({ … })` → same, negative amount; **refuses to go below zero** unless
  `allowNegative` (admin override) is set; returns `{ ok, balanceAfter, shortfall }`.
- All writes go through here. Nothing else touches `wallet_balance_cents` directly.

**FX helper `server/utils/fx.ts`** — a single source of truth for the conversion used only at
top-up time:

- `getUsdToZarRate()` → reads a configurable rate from env (`USD_TO_ZAR`, e.g. `19.50`). A
  **fixed manual rate** to start (simple, predictable); can swap to a cached live-rate API
  later without touching callers.
- `usdCentsToZarCents(usdCents)` → applies the rate (round up to the nearest cent/Rand).
- Build in a **small buffer** in the rate (bill slightly above spot) to absorb FX drift,
  since you collect a fixed ZAR amount but owe a USD-denominated balance.

**Gate:** you can credit/debit a test customer and the ledger + cached balance always agree.

### 4.3 Phase W2 — Top-ups (put money in)

1. **Repurpose `checkout/create.post.ts`:** accept `{ purpose: "topup", amountCents }` where
   `amountCents` is the **USD** amount the customer chose (validate a sane **minimum**, e.g.
   $25). Convert USD→ZAR via `fx.ts`, initialize a Paystack transaction **for the ZAR
   amount** with a `twf_topup_…` reference and metadata `{ purpose: "topup", customerId,
usdCents, fxRate }`. Return `access_code` / `authorization_url`. The checkout UI must show
   the exact ZAR charge before the customer confirms (e.g. _"$500 ≈ R9,750 — you'll be charged
   R9,750"_).
2. **Webhook `charge.success`:** if `metadata.purpose === "topup"` (or the ref starts
   `twf_topup_`), **re-verify** the transaction (confirm the ZAR amount matches), then
   `wallet.credit(...)` for the **USD** amount from `metadata.usdCents` (storing
   `chargedZarCents` + `fxRate` for the audit trail), and send the **top-up receipt** email.
   Idempotent on the reference (ignore repeats).
3. **Frontend:** a "**Add funds**" action (in the portal, [§4.5](#45-phase-w4--customer-portal))
   that posts to `/api/checkout/create` and opens Paystack Popup (`@paystack/inline-js`,
   already installed) or redirects to `authorization_url`.

**Gate:** a test-card top-up credits the wallet via the verified webhook and emails a receipt.

### 4.4 Phase W3 — Recurring debits (take the monthly fees)

1. **Define recurring charges:** admin attaches `recurring_charges` to a customer/site (e.g.
   "Dynamic Hosting $45/mo", "DB Small $10/mo") with a
   `next_charge_at`.
2. **Scheduled job** (Nitro **scheduled task** / cron, e.g. daily at 06:00): find all
   `active` recurring charges with `next_charge_at <= now`, and for each:
   - `wallet.debit(...)`. If it succeeds → record the ledger row, set `next_charge_at += 1
month`.
   - If **insufficient balance** → don't debit; mark a **low-balance** state, send the
     **low-balance email** (you already have a dunning-style template to adapt), and start a
     **grace window** (e.g. 7 days).
   - After grace with still-empty balance → set the site `status = 'suspended'` (Phase 5
     admin action / automatic) and notify.
3. **Idempotency / safety:** guard so a job re-run on the same day can't double-charge
   (advance `next_charge_at` atomically in the same transaction as the debit).

> Nitro scheduled tasks run in-process — fine for a single server. If you later run multiple
> instances, add a DB lock so only one runs the job. (Hosting is your domain; just note it.)

**Gate:** with a funded wallet, the daily job debits a due charge once, advances the date,
and emails on low balance.

### 4.5 Phase W4 — Customer portal

1. **Customer sign-in:** reuse Firebase Google sign-in (infra exists); just don't gate
   customers behind `ADMIN_EMAILS`. Use `requireCustomer` / `resolveCustomer` (already in
   [server/utils/customer-auth.ts](server/utils/customer-auth.ts)).
2. **`app/pages/account/index.vue`** showing:
   - **Wallet balance** + **runway** ("~$45/mo · lasts ~6 months"), in USD.
   - **"Add funds"** button (Phase W2) — shows the ZAR charge equivalent at confirm time.
   - **Transaction history** (the ledger): date, description, +/- amount (USD), balance after.
   - **Active recurring services** and their monthly cost (USD).
   - Their **sites** and **one-off invoices/receipts** (builds).
3. **Endpoints** (replace the subscription ones): `GET /api/account/wallet` (balance +
   recurring + runway), `GET /api/account/transactions` (paged ledger), reuse
   `GET /api/account/billing` for one-off invoices. All filtered by the **verified UID** —
   never client-supplied ids.
4. **Change-request form** → writes to a `change_requests` table (or reuse `leads` with
   `source='change_request'`); admin later turns an approved change into a **wallet debit**.

**Gate:** a customer signs in, sees balance + history + runway, and can top up.

### 4.6 Phase W5 — One-off builds (unchanged concept)

- Website builds stay **normal one-time Paystack charges** (not wallet). Reuse
  `checkout/create.post.ts` with `purpose: "build"` + a catalogue key; the USD build price is
  converted to ZAR via `fx.ts` for the actual Paystack charge (same as top-ups), and the UI
  shows the ZAR amount before paying. Webhook `charge.success` marks the `invoices` row paid
  and emails a receipt. (Most of this already exists — just keep the build path and add the
  USD→ZAR conversion.)

**Gate:** a customer can pay a build deposit/price via Paystack and it shows as a paid invoice.

---

## 5. Admin Operations (Phase 5, wallet-aware)

Make the dashboards _operational_. Each = a POST/PATCH route + a button in the matching Vue
page, and **every mutation writes an `audit_log` row**.

1. **Wallet controls** (new, central to this model):
   - **Manual credit** (e.g. record an EFT top-up, goodwill credit) → `wallet.credit`.
   - **Manual debit / charge a feature or change** → `wallet.debit` with a description
     ("Feature: booking calendar — R1,200"). This is how feature requests get billed.
   - **Adjustment / refund** with reason.
   - View any customer's **balance + full ledger**.
2. **Recurring charges:** create/edit/pause a customer's hosting/DB monthly amounts.
3. **Customers:** create/edit; **convert a won lead → customer**.
4. **Sites:** create/edit + **suspend / resume / offboard** (ties to low-balance in W3).
5. **Domains:** create/edit records, mark renewals (manual — Cloudflare excluded).
6. **One-off invoices:** create manual invoice (offline-quoted build), mark paid, refund via
   Paystack `refundTransaction` (helper exists).
7. **Audit log + DB-backed admins:** write `audit_log` on every action; optionally move the
   admin roster from `ADMIN_EMAILS` into `admin_users`.

**Gate:** you can run the whole business from `/admin` — top up a wallet, charge a feature,
set monthly fees, convert a lead, suspend for an empty wallet — without touching the DB.

---

## 6. STEP-BY-STEP — everything to get live (excluding Cloudflare)

Do these in order. ☐ = a thing you physically do.

### Step A — Local foundation (30 min)

1. ☐ Start **Docker Desktop** (it was off — that's why `db:migrate` failed).
2. ☐ `pnpm db:up` — starts Postgres.
3. ☐ `pnpm db:migrate` — applies `0000` + `0001` (the `paystack_customer_code` column).
4. ☐ `pnpm dev` → open <http://localhost:3000>; confirm the site runs.
5. ☐ Sign in at `/admin/login` with `chadwddk@gmail.com`; confirm dashboards load.
6. ☐ Submit `/contact`; confirm the lead appears in `/admin/leads`.

### Step B — Resend (email) — confirm it actually sends

_(You said the Resend keys are already in `.env`. Verify end-to-end.)_

1. ☐ In Resend → **Domains**, confirm `pixelatedindustries.com` shows **Verified** (the
   SPF/DKIM CNAMEs you added are **DNS-only/grey** in Cloudflare — already covered).
2. ☐ Confirm `.env` has `MAIL_FROM="TheWebsiteForge <hello@pixelatedindustries.com>"` (the
   from-address **must** be on the verified domain) and `MAIL_ADMIN=chadwddk@gmail.com`.
3. ☐ Restart `pnpm dev` (so new env loads) → submit the contact form again.
4. ☐ Confirm **two** emails: a "new lead" alert to `MAIL_ADMIN`, and a confirmation to the
   address you used. If nothing arrives, check the dev console — `email.ts` logs `[email]`
   lines and never throws.
5. ☐ Keep **Opportunistic TLS** (already decided — right choice for transactional mail).

### Step C — Paystack — accounts, keys, webhook (NO Plans needed now)

> Because of the wallet model you can **skip Paystack Plans entirely** — top-ups are one-time
> charges. This is much less setup than the original plan.

1. ☐ In Paystack, stay in **Test mode** while building.
2. ☐ **Settings → API Keys & Webhooks**: copy **Test Secret** (`sk_test_…`) →
   `PAYSTACK_SECRET_KEY`, and **Test Public** (`pk_test_…`) → `NUXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
   in `.env`. (Done already if your keys are in.)
3. ☐ Set `NUXT_PUBLIC_SITE_URL` in `.env`:
   - local testing: your tunnel URL (you're handling tunnels);
   - production: `https://websiteforge.pixelatedindustries.com`.
4. ☐ **Webhook URL** (Settings → API Keys & Webhooks):
   - Test: `https://<your-tunnel>/api/webhooks/paystack`
   - Live (later): `https://websiteforge.pixelatedindustries.com/api/webhooks/paystack`
   - Signature is verified automatically (HMAC-SHA512 vs `PAYSTACK_SECRET_KEY`) — no extra
     secret to set.
5. ☐ You can now **ignore** the `PAYSTACK_PLAN_*` lines in `.env.example` — leave them blank;
   the wallet model doesn't use them. _(I'll prune them from the code/docs when we build W1.)_
6. ☐ **Business activation** (do in parallel; needed for Live keys + payouts): submit business
   details + **SA bank account** + the **bank confirmation letter** (download from your
   banking app — not a statement). Choose **Starter Business** for now; formalise the entity
   before real revenue.
7. ☐ After activation: redo step 2 with **Live** keys (`sk_live_…`, `pk_live_…`) and set the
   **Live** webhook URL.

### Step D — Pricing (settle this before wiring buttons) — see [§7](#7-pricing--display-usd-charge-zar)

1. ☐ **Display currency = USD** (DECIDED — global audience). Charge currency = **ZAR** (Paystack).
2. ☐ Set the **`USD_TO_ZAR` rate** in `.env` (start with a fixed, slightly-buffered manual
   rate, e.g. `19.50`). Review it periodically.
3. ☐ Fill in the **USD rate card** in [§7](#7-pricing--display-usd-charge-zar): build prices,
   monthly hosting/DB, and a **minimum top-up** — all in USD.
4. ☐ Update `shared/site.ts` (public USD display) and `shared/billing.ts` (server USD amounts)
   with the agreed figures. The conversion to ZAR happens only at checkout via `fx.ts`.
   _(I'll do these edits once you give numbers.)_

### Step E — Build the wallet (Phases W1→W5, then Admin) — [§4](#4-the-wallet-build-plan-phase-by-phase) & [§5](#5-admin-operations-phase-5-wallet-aware)

1. ☐ **W1** wallet schema + `wallet.ts` ledger util + migration; `pnpm db:migrate`.
2. ☐ **W2** top-up checkout + webhook credit + receipt.
3. ☐ **W3** recurring-charge table + scheduled monthly debit + low-balance email + grace.
4. ☐ **W4** customer portal (sign-in, balance, runway, ledger, add funds, change requests).
5. ☐ **W5** confirm one-off build checkout path.
6. ☐ **Admin** wallet credit/debit, recurring-charge management, convert lead, site
   suspend/resume, manual invoice/refund, audit log.

### Step F — Hardening & go-live (Phase 7)

1. ☐ Add a **`/privacy` page** (required by Paystack/most processors; you have none).
2. ☐ **Rate-limit** public POST routes (`/api/contact`, `/api/checkout/create`).
3. ☐ **Rotate** the Firebase service-account key + Postgres password (they were exposed in
   chat during dev).
4. ☐ Switch Paystack + site to **Live** keys; do **one small real top-up** end-to-end.
5. ☐ **Lawyer review** of Terms, Hosting Agreement, Refund Policy (now including the
   **wallet/credit terms**: never-expires, refundability, suspension on empty balance) +
   the new Privacy Policy.
6. ☐ Plan **Postgres backups** (your hosting concern).

---

## 7. Pricing — display USD, charge ZAR

**Decided (Option A):** the site, the rate card, and the wallet are all in **USD**. Paystack
charges the **ZAR equivalent** at the moment of payment, using a configurable `USD_TO_ZAR`
rate. The customer always sees the exact ZAR amount before confirming.

**How it works in practice:**

- Prices live in **USD** in `shared/site.ts` (display) and `shared/billing.ts` (server).
- A single **`USD_TO_ZAR`** env var holds the rate (start fixed/manual, e.g. `19.50`).
- At checkout (top-up or build), `fx.ts` converts USD→ZAR; Paystack charges the ZAR amount;
  the wallet is credited/charged in **USD**.
- Build a **buffer** into the rate (price a little above spot, e.g. bill at `19.50` when spot
  is ~`18.80`) because you collect a fixed ZAR amount but carry a USD-denominated liability.
  The buffer absorbs currency drift between top-ups.

Fill the **USD** column with your real numbers (the current values are placeholders; you decide).
We update `shared/site.ts` + `shared/billing.ts` once you confirm.

**One-off builds (charged normally, not wallet — converted to ZAR at checkout):**

| Item          | Current (USD) | Your price (USD) |
| ------------- | ------------- | ---------------- |
| Starter Site  | $650          | $**\_\_**        |
| Business Site | $1,850        | $**\_\_**        |
| Custom Build  | quote         | quote            |

**Recurring (debited monthly from the wallet, in USD):**

| Service           | Current (USD/mo) | Your price (USD/mo) |
| ----------------- | ---------------- | ------------------- |
| Static Hosting    | $15              | $**\_\_**           |
| Dynamic Hosting   | $45              | $**\_\_**           |
| App Hosting       | $120             | $**\_\_**           |
| Database — Small  | $10              | $**\_\_**           |
| Database — Medium | $25              | $**\_\_**           |
| Database — Large  | $60              | $**\_\_**           |

> **Care plans removed (DECIDED).** Baseline maintenance — security/dependency updates,
> backups, uptime monitoring, and minor text/image tweaks — is now **bundled into the hosting
> tiers** (price hosting to absorb that upkeep). Everything beyond baseline (new features,
> redesigns, larger content work) is charged **ad-hoc** as a wallet debit, quoted per request.
> This drops a SKU and matches the wallet philosophy, while still keeping sites patched and
> secure (which customers never think to request on their own).

**Currency + wallet settings to decide:**

| Setting                     | Suggested                                      | Your call     |
| --------------------------- | ---------------------------------------------- | ------------- |
| `USD_TO_ZAR` rate           | ~spot + small buffer (e.g. 19.50)              | ****\_\_****  |
| Rate source                 | Fixed/manual to start; live API later          | ****\_\_****  |
| Minimum top-up              | ≥ 1 month of the customer's hosting (e.g. $50) | $**\_\_**     |
| Suggested top-up presets    | $50 / $150 / $300 / $600                       | ****\_\_****  |
| Credit expiry               | Never (CPA-friendly)                           | ****\_\_****  |
| Refundable?                 | Non-refundable by default; goodwill minus fees | ****\_\_****  |
| Low-balance warning at      | < 1 month of recurring burn                    | ****\_\_****  |
| Grace period before suspend | 7 days                                         | **\_\_** days |
| Feature/change billing      | Ad-hoc wallet debit (USD), quoted per request  | ****\_\_****  |

> ⚠️ **Always show the ZAR charge at checkout** (e.g. _"$500 ≈ R9,750 — you'll be charged
> R9,750"_). It's what hits the customer's statement; hiding it causes disputes/chargebacks.
> Also confirm with Paystack that **international cards** are enabled on your account before
> marketing globally (some SA accounts are domestic-only until requested).

---

## 8. Definition of Done (wallet edition)

- [ ] Foundation: Docker up, `0000`+`0001` migrated, admin sign-in works, contact writes leads.
- [ ] Email verified end-to-end (lead alert + confirmation arrive; receipts on top-up).
- [ ] **Wallet:** customers can **top up** via Paystack; balance + ledger always reconcile.
- [ ] **Recurring debits:** monthly job draws hosting/DB from the wallet; low-balance
      email + grace + suspend-on-empty work.
- [ ] **Feature/change billing:** admin can debit the wallet ad-hoc with a clear description.
- [ ] **One-off builds:** charged normally via Paystack; show as paid invoices.
- [ ] **Customer portal:** sign-in, balance, runway, transaction history, add-funds, change
      requests.
- [ ] **Admin:** wallet credit/debit, recurring-charge setup, convert lead, suspend/resume,
      manual invoice/refund — all logged in `audit_log`.
- [ ] **Display USD, charge ZAR:** prices in USD across the site + server; `USD_TO_ZAR` set;
      checkout shows the ZAR amount; wallet denominated in USD.
- [ ] `/privacy` live; public POST routes rate-limited; secrets rotated.
- [ ] Legals (incl. **wallet/credit terms**) lawyer-reviewed; Paystack **Live** + SA bank
      account active; one real top-up tested.

---

## 9. Open decisions I need from you

1. **Adopt the wallet model?** (My strong recommendation: yes.)
2. **The USD rate card** + `USD_TO_ZAR` rate + wallet settings in [§7](#7-pricing--display-usd-charge-zar).
3. **Credit policy:** never-expires (recommended) and refundable-or-not.
4. **Display currency:** ✅ **DECIDED — USD display, ZAR charge (Option A).**
5. Then I start **Phase W1** (wallet schema + ledger) and work down Step E.

_Active plan for TheWebsiteForge. Supersedes the build-order in TheWebsiteForgePlan.md;
Paystack/Resend account write-ups there remain valid. Cloudflare and hosting/deployment
intentionally out of scope._
