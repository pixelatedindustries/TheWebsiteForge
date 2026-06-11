<script setup lang="ts">
import { pricingTiers } from "~~/shared/site";

withDefaults(
  defineProps<{ showHeading?: boolean }>(),
  { showHeading: true },
);
</script>

<template>
  <section class="px-4 py-20 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl">
      <SectionHeading
        v-if="showHeading"
        eyebrow="Pricing"
        title="Website packages with room to grow"
        subtitle="Simple starting points for landing pages, business websites, and custom builds. We scope the details with you before work starts."
      />

      <div
        v-reveal:stagger="{ selector: '.tier', stagger: 0.13, y: 52 }"
        class="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:items-stretch"
      >
        <div v-for="tier in pricingTiers" :key="tier.id" class="tier">
          <PricingCard :tier="tier" />
        </div>
      </div>

      <p class="mt-8 text-center text-sm text-slate-500">
        Prices in USD; you'll be charged the ZAR equivalent at checkout. Need something custom?
        <NuxtLink to="/contact" class="text-brand-300 underline-offset-4 hover:underline">
          Tell us about your project
        </NuxtLink>
      </p>
    </div>
  </section>
</template>
