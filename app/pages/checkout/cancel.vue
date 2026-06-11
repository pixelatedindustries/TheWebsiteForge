<script setup lang="ts">
/**
 * Checkout cancel page (plan §5.2 step 7).
 * Shown when a customer abandons the Paystack hosted checkout. No charge was
 * made; we just offer a friendly way back.
 */
useSeoMeta({ title: "Checkout cancelled — TheWebsiteForge", robots: "noindex" });
</script>

<template>
  <div class="px-4 pt-36 pb-24 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-xl text-center" v-motion="reveal(0)">
      <div class="glass rounded-2xl p-10">
        <h1 class="font-display text-3xl font-bold text-white">
          Checkout cancelled
        </h1>
        <p class="mt-3 text-slate-400">
          No payment was taken. You can pick up where you left off whenever
          you're ready.
        </p>
        <div class="mt-8 flex justify-center gap-3">
          <NuxtLink
            to="/pricing"
            class="rounded-xl bg-gradient-to-br from-brand-500 to-accent-600 px-5 py-2.5 font-semibold text-white"
          >
            Back to pricing
          </NuxtLink>
          <NuxtLink
            to="/contact"
            class="glass rounded-xl px-5 py-2.5 font-semibold text-white"
          >
            Talk to us
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
