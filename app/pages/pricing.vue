<script setup lang="ts">
import {
  hostingPlans,
  databaseTiers,
  carePlans,
  domainInfo,
} from "~~/shared/site";

useSeoMeta({
  title: "Pricing - The Website Forge",
  description:
    "Website pricing for landing pages, business websites, and custom web builds — plus hosting, databases, care plans, and domains.",
});

const dollars = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

// Plan comparison matrix: true / false / string per plan [Starter, Business, Custom]
const matrix: { label: string; values: (boolean | string)[] }[] = [
  {
    label: "Best for",
    values: ["New offers", "Growing businesses", "Apps and systems"],
  },
  {
    label: "Page count",
    values: ["1 page", "Up to 6 pages", "Scoped to project"],
  },
  { label: "Custom layout", values: [true, true, true] },
  {
    label: "Animations and transitions",
    values: ["Light", "Included", "Advanced"],
  },
  { label: "Contact forms", values: [true, true, true] },
  { label: "CMS or editable content", values: [false, "Optional", true] },
  { label: "Ecommerce, auth, or database", values: [false, false, true] },
  {
    label: "SEO setup",
    values: ["Basic", "Full page setup", "Technical setup"],
  },
  { label: "Revision rounds", values: ["1", "3", "Scoped"] },
  {
    label: "Typical timeline",
    values: ["3-5 days", "1-3 weeks", "By milestone"],
  },
  {
    label: "After-launch support",
    values: ["Handover", "Launch support", "Optional retainer"],
  },
];
const plans = ["Starter", "Business", "Custom"];
</script>

<template>
  <div class="pt-20">
    <PricingSection />

    <!-- comparison table -->
    <section class="px-4 py-12 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Compare"
          title="Choose the build size"
          subtitle="A practical side-by-side view of what each website package is meant for."
        />

        <div
          v-motion="reveal()"
          class="glass-strong mt-10 overflow-hidden rounded-2xl"
        >
          <div class="overflow-x-auto">
            <table class="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr class="border-b border-white/10">
                  <th class="px-5 py-4 font-medium text-slate-400">Feature</th>
                  <th
                    v-for="(plan, i) in plans"
                    :key="plan"
                    class="px-5 py-4 text-center font-display font-semibold"
                    :class="i === 1 ? 'text-brand-300' : 'text-white'"
                  >
                    {{ plan }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in matrix"
                  :key="row.label"
                  class="border-b border-white/5 last:border-0"
                >
                  <td class="px-5 py-3.5 text-slate-300">{{ row.label }}</td>
                  <td
                    v-for="(val, i) in row.values"
                    :key="i"
                    class="px-5 py-3.5 text-center"
                    :class="i === 1 ? 'bg-white/[0.02]' : ''"
                  >
                    <template v-if="typeof val === 'boolean'">
                      <svg
                        v-if="val"
                        class="mx-auto h-4 w-4 text-brand-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span v-else class="text-slate-600">-</span>
                    </template>
                    <span v-else class="text-slate-200">{{ val }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- hosting plans -->
    <section class="px-4 py-12 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Hosting"
          title="We host it, you relax"
          subtitle="After launch, we keep your site online, fast, and backed up. Small text and image changes are included — bigger structural changes are quoted separately."
        />

        <div class="mt-10 grid gap-6 md:grid-cols-3">
          <div
            v-for="(plan, i) in hostingPlans"
            :key="plan.id"
            v-motion="reveal(i)"
            class="glass gradient-border relative flex flex-col rounded-2xl p-6"
            :class="plan.highlighted ? 'ring-1 ring-brand-400/40' : ''"
          >
            <span
              v-if="plan.highlighted"
              class="absolute -top-3 left-6 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white"
            >
              Most popular
            </span>
            <h3 class="font-display text-lg font-semibold text-white">
              {{ plan.name }}
            </h3>
            <p class="mt-2 text-sm text-slate-400">{{ plan.tagline }}</p>
            <p class="mt-5">
              <span class="text-xs text-slate-500">{{
                plan.from ? "from" : ""
              }}</span>
              <span class="font-display text-3xl font-semibold text-white">
                {{ dollars(plan.price) }}
              </span>
              <span class="text-sm text-slate-400">/mo</span>
            </p>
            <ul class="mt-5 flex-1 space-y-2.5 text-sm text-slate-300">
              <li
                v-for="f in plan.features"
                :key="f"
                class="flex items-start gap-2"
              >
                <svg
                  class="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {{ f }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- databases + domains -->
    <section class="px-4 py-12 sm:px-6 lg:px-8">
      <div class="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
        <!-- database add-on -->
        <div v-motion="reveal()" class="glass gradient-border rounded-2xl p-7">
          <h3 class="font-display text-lg font-semibold text-white">
            Database hosting
          </h3>
          <p class="mt-2 text-sm text-slate-400">
            Need a database for logins, products, or content? Add a managed
            database sized to your site. Pick a tier below, or we can run it on
            a managed cloud provider at cost plus a small handling fee.
          </p>
          <div class="mt-6 space-y-3">
            <div
              v-for="tier in databaseTiers"
              :key="tier.id"
              class="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3"
            >
              <div>
                <p class="text-sm font-semibold text-white">{{ tier.name }}</p>
                <p class="text-xs text-slate-400">{{ tier.detail }}</p>
              </div>
              <div class="whitespace-nowrap text-right">
                <p class="text-sm font-semibold text-brand-300">
                  {{ dollars(tier.price)
                  }}<span class="text-slate-400">/{{ tier.period }}</span>
                  <span class="text-xs font-normal text-slate-500">
                    self-hosted</span
                  >
                </p>
                <p v-if="tier.managedPrice" class="text-xs text-slate-400">
                  {{ dollars(tier.managedPrice) }}/{{ tier.period }} managed
                </p>
              </div>
            </div>
          </div>
          <p class="mt-4 text-xs text-slate-500">
            Self-hosted runs on our infrastructure. Managed runs on a cloud
            provider for extra resilience. Billed monthly from your wallet.
          </p>
        </div>

        <!-- domains -->
        <div v-motion="reveal(1)" class="glass gradient-border rounded-2xl p-7">
          <h3 class="font-display text-lg font-semibold text-white">Domains</h3>
          <p class="mt-2 text-sm text-slate-400">{{ domainInfo.tagline }}</p>
          <ul class="mt-6 space-y-3 text-sm text-slate-300">
            <li
              v-for="point in domainInfo.points"
              :key="point"
              class="flex items-start gap-2"
            >
              <svg
                class="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {{ point }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- care plans -->
    <section class="px-4 py-12 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Care plans"
          title="Optional ongoing care"
          subtitle="Want us to actively look after the site beyond hosting? Add a care plan for regular updates, checks, and content help."
        />

        <div class="mt-10 grid gap-6 md:grid-cols-2">
          <div
            v-for="(plan, i) in carePlans"
            :key="plan.id"
            v-motion="reveal(i)"
            class="glass gradient-border relative flex flex-col rounded-2xl p-6"
            :class="plan.highlighted ? 'ring-1 ring-brand-400/40' : ''"
          >
            <h3 class="font-display text-lg font-semibold text-white">
              {{ plan.name }}
            </h3>
            <p class="mt-2 text-sm text-slate-400">{{ plan.tagline }}</p>
            <p class="mt-5">
              <span class="font-display text-3xl font-semibold text-white">
                {{ dollars(plan.price) }}
              </span>
              <span class="text-sm text-slate-400">/mo</span>
            </p>
            <ul class="mt-5 flex-1 space-y-2.5 text-sm text-slate-300">
              <li
                v-for="f in plan.features"
                :key="f"
                class="flex items-start gap-2"
              >
                <svg
                  class="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {{ f }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <FaqAccordion />
    <CtaSection
      title="Not sure which one fits?"
      subtitle="Send us your idea and we'll recommend the right route with a clear scope."
    />
  </div>
</template>
