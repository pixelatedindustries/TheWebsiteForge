<script setup lang="ts">
interface LegalSection {
  heading: string;
  body: string[];
}

defineProps<{
  title: string;
  subtitle: string;
  effectiveDate: string;
  documentCode: string;
  sections: LegalSection[];
}>();

const route = useRoute();
const policies = [
  { label: "Terms", to: "/terms" },
  { label: "Hosting Agreement", to: "/hosting-agreement" },
  { label: "Refund Policy", to: "/refund-policy" },
];
</script>

<template>
  <main class="legal-page min-h-screen pt-36 text-[#ece9e2]">
    <section class="border-b border-white/10 px-6 pb-16 sm:px-10 lg:px-20">
      <div class="mx-auto max-w-[1500px]">
        <div
          class="flex flex-wrap justify-between gap-4 font-mono text-[0.55rem] uppercase tracking-[0.3em] text-white/35"
        >
          <span>Legal archive / {{ documentCode }}</span>
          <span>Effective {{ effectiveDate }}</span>
        </div>
        <div class="mt-16 grid items-end gap-12 lg:grid-cols-[1fr_0.34fr]">
          <h1
            class="max-w-6xl font-display text-[clamp(4.5rem,11vw,11rem)] font-medium leading-[0.78] tracking-[-0.085em]"
          >
            {{ title }}
          </h1>
          <div class="max-w-sm border-l border-white/15 pl-6">
            <span class="mb-5 block h-2 w-2 rounded-full bg-brand-300" />
            <p class="text-base leading-relaxed text-white/48">
              {{ subtitle }}
            </p>
          </div>
        </div>
        <nav
          class="mt-16 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/10 pt-6"
          aria-label="Legal documents"
        >
          <NuxtLink
            v-for="policy in policies"
            :key="policy.to"
            :to="policy.to"
            class="legal-policy-link font-mono text-[0.52rem] uppercase tracking-[0.22em] text-white/35"
            :class="{ 'is-active': route.path === policy.to }"
          >
            {{ policy.label }}
          </NuxtLink>
        </nav>
      </div>
    </section>

    <section class="px-6 py-20 sm:px-10 lg:px-20">
      <div
        class="mx-auto grid max-w-[1500px] gap-16 lg:grid-cols-[17rem_minmax(0,1fr)]"
      >
        <aside class="hidden lg:block">
          <div class="sticky top-32">
            <p
              class="mb-6 font-mono text-[0.52rem] uppercase tracking-[0.25em] text-white/28"
            >
              Document index
            </p>
            <nav class="space-y-1 border-l border-white/10">
              <a
                v-for="(section, index) in sections"
                :key="section.heading"
                :href="`#clause-${index + 1}`"
                class="legal-index-link block py-2 pl-5 text-xs leading-relaxed text-white/32"
              >
                {{ section.heading }}
              </a>
            </nav>
          </div>
        </aside>

        <div class="min-w-0">
          <article
            v-for="(section, index) in sections"
            :id="`clause-${index + 1}`"
            :key="section.heading"
            v-reveal="{ y: 24, delay: Math.min(index, 3) * 0.04 }"
            class="legal-clause grid scroll-mt-32 gap-6 border-t border-white/10 py-10 md:grid-cols-[4rem_minmax(0,1fr)] md:gap-10"
          >
            <span
              class="font-mono text-[0.52rem] tracking-[0.25em] text-white/24"
            >
              {{ String(index + 1).padStart(2, "0") }}
            </span>
            <div>
              <h2
                class="font-display text-[clamp(1.8rem,3vw,3rem)] font-medium leading-none tracking-[-0.055em] text-white/90"
              >
                {{ section.heading.replace(/^\d+\.\s*/, "") }}
              </h2>
              <div class="mt-7 max-w-4xl space-y-5">
                <p
                  v-for="(paragraph, paragraphIndex) in section.body"
                  :key="paragraphIndex"
                  class="text-[0.95rem] leading-[1.85] text-white/46"
                >
                  {{ paragraph }}
                </p>
              </div>
            </div>
          </article>

          <div
            class="mt-12 grid gap-8 border-y border-white/10 py-10 sm:grid-cols-[1fr_auto] sm:items-center"
          >
            <div>
              <p
                class="font-mono text-[0.52rem] uppercase tracking-[0.24em] text-white/28"
              >
                Questions about this document?
              </p>
              <p class="mt-3 max-w-xl text-sm leading-relaxed text-white/45">
                Send us the clause you need clarified. We reply within one
                business day.
              </p>
            </div>
            <NuxtLink
              to="/contact"
              class="rounded-full border border-white/15 px-6 py-3 font-mono text-[0.52rem] uppercase tracking-[0.2em] transition hover:bg-white hover:text-black"
            >
              Contact us ->
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.legal-page {
  background:
    radial-gradient(
      circle at 82% 7%,
      rgba(255, 255, 255, 0.035),
      transparent 24%
    ),
    #0e0d0c;
}
.legal-policy-link,
.legal-index-link {
  position: relative;
  transition: color 300ms ease;
}
.legal-policy-link {
  padding-bottom: 0.35rem;
}
.legal-policy-link::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 1px;
  background: #ece9e2;
  content: "";
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 350ms cubic-bezier(0.22, 1, 0.36, 1);
}
.legal-policy-link:hover,
.legal-policy-link.is-active,
.legal-index-link:hover {
  color: rgba(255, 255, 255, 0.9);
}
.legal-policy-link.is-active::after {
  transform: scaleX(1);
}
.legal-index-link::before {
  position: absolute;
  top: 50%;
  left: -1px;
  width: 1px;
  height: 0;
  background: #ece9e2;
  content: "";
  transform: translateY(-50%);
  transition: height 300ms ease;
}
.legal-index-link:hover::before {
  height: 100%;
}
.legal-clause:first-child {
  padding-top: 0;
  border-top: 0;
}
</style>
