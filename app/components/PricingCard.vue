<script setup lang="ts">
import type { PricingTier } from "~~/shared/site";

const props = defineProps<{ tier: PricingTier }>();

const priceLabel = computed(() =>
  props.tier.fixed
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(props.tier.price)
    : "Custom",
);
</script>

<template>
  <div
    v-spotlight
    class="relative flex flex-col rounded-2xl p-7 transition duration-300"
    :class="
      tier.highlighted
        ? 'glass-strong gradient-border glow-ring lg:-translate-y-3 lg:scale-[1.03]'
        : 'glass hover:-translate-y-1.5 hover:glow-ring'
    "
  >
    <!-- animated glow behind the featured plan -->
    <div
      v-if="tier.highlighted"
      aria-hidden="true"
      class="animate-pulse-glow pointer-events-none absolute -inset-px -z-10 rounded-2xl opacity-70 blur-xl"
      style="
        background: linear-gradient(
          135deg,
          var(--color-brand-500),
          var(--color-accent-600)
        );
      "
    />
    <span
      v-if="tier.highlighted"
      class="btn-gradient absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white"
    >
      Most popular
    </span>

    <h3 class="font-display text-xl font-semibold text-white">
      {{ tier.name }}
    </h3>
    <p class="mt-1.5 text-sm text-slate-400">{{ tier.tagline }}</p>

    <div class="mt-6 flex items-baseline gap-1.5">
      <span v-count class="font-display text-4xl font-bold text-white">{{
        priceLabel
      }}</span>
      <span class="text-sm text-slate-500">/ {{ tier.period }}</span>
    </div>

    <ul class="mt-6 flex-1 space-y-3">
      <li
        v-for="feature in tier.features"
        :key="feature"
        class="flex items-start gap-3 text-sm text-slate-300"
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
        {{ feature }}
      </li>
    </ul>

    <NuxtLink
      v-magnetic="0.4"
      :to="tier.planKey ? `/checkout/start?plan=${tier.planKey}` : '/contact'"
      class="mt-8 inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition"
      :class="
        tier.highlighted
          ? 'btn-gradient text-white'
          : 'glass text-white hover:bg-white/10'
      "
    >
      {{ tier.cta }}
    </NuxtLink>
  </div>
</template>
