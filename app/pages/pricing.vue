<script setup lang="ts">
useSeoMeta({
  title: "Pricing - Your Website Source",
  description:
    "Website pricing for landing pages, business websites, and custom web builds.",
});

// Plan comparison matrix: true / false / string per plan [Starter, Business, Custom]
const matrix: { label: string; values: (boolean | string)[] }[] = [
  { label: "Best for", values: ["New offers", "Growing businesses", "Apps and systems"] },
  { label: "Page count", values: ["1 page", "Up to 6 pages", "Scoped to project"] },
  { label: "Custom layout", values: [true, true, true] },
  { label: "Animations and transitions", values: ["Light", "Included", "Advanced"] },
  { label: "Contact forms", values: [true, true, true] },
  { label: "CMS or editable content", values: [false, "Optional", true] },
  { label: "Ecommerce, auth, or database", values: [false, false, true] },
  { label: "SEO setup", values: ["Basic", "Full page setup", "Technical setup"] },
  { label: "Revision rounds", values: ["1", "3", "Scoped"] },
  { label: "Typical timeline", values: ["3-5 days", "1-3 weeks", "By milestone"] },
  { label: "After-launch support", values: ["Handover", "Launch support", "Optional retainer"] },
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

    <FaqAccordion />
    <CtaSection
      title="Not sure which one fits?"
      subtitle="Send us your idea and we'll recommend the right route with a clear scope."
    />
  </div>
</template>
