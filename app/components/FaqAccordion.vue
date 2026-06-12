<script setup lang="ts">
import { faqs } from "~~/shared/site";

const openIndex = ref<number | null>(0);
const toggle = (i: number) => {
  const opening = openIndex.value !== i;
  openIndex.value = opening ? i : null;
  // Move focus to the revealed panel so keyboard users land on the answer
  // instead of having to tab past collapsed items (issues.md #17).
  if (opening) {
    nextTick(() => {
      document.getElementById(`faq-panel-${i}`)?.focus();
    });
  }
};
</script>

<template>
  <section class="px-4 py-20 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-3xl">
      <SectionHeading eyebrow="FAQ" title="Questions, answered" />

      <div class="mt-10 space-y-3">
        <div
          v-for="(faq, i) in faqs"
          :key="faq.q"
          v-motion="reveal(i, { step: 60 })"
          class="glass overflow-hidden rounded-xl"
        >
          <button
            :id="`faq-trigger-${i}`"
            type="button"
            class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            :aria-expanded="openIndex === i"
            :aria-controls="`faq-panel-${i}`"
            @click="toggle(i)"
          >
            <span class="text-sm font-semibold text-white sm:text-base">
              {{ faq.q }}
            </span>
            <svg
              class="h-5 w-5 shrink-0 text-brand-300 transition-transform duration-300"
              :class="openIndex === i ? 'rotate-45' : ''"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="max-h-0 opacity-0"
            enter-to-class="max-h-60 opacity-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="max-h-60 opacity-100"
            leave-to-class="max-h-0 opacity-0"
          >
            <div
              v-if="openIndex === i"
              :id="`faq-panel-${i}`"
              role="region"
              :aria-labelledby="`faq-trigger-${i}`"
              tabindex="-1"
              class="overflow-hidden outline-none"
            >
              <p class="px-5 pb-5 text-sm leading-relaxed text-slate-400">
                {{ faq.a }}
              </p>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </section>
</template>
