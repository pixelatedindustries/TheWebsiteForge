<script setup lang="ts">
import type { Testimonial } from "~~/shared/site";

defineProps<{ testimonial: Testimonial }>();
</script>

<template>
  <figure v-spotlight class="glass flex h-full flex-col rounded-2xl p-6">
    <div class="mb-4 flex gap-0.5 text-brand-400">
      <svg
        v-for="n in 5"
        :key="n"
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2z"
        />
      </svg>
    </div>
    <blockquote class="flex-1 text-sm leading-relaxed text-slate-200">
      "{{ testimonial.quote }}"
    </blockquote>
    <figcaption
      class="mt-5 flex items-center gap-3 border-t border-white/10 pt-4"
    >
      <span
        class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-600 text-sm font-bold text-white"
      >
        {{ testimonial.initials }}
      </span>
      <div>
        <p class="text-sm font-semibold text-white">{{ testimonial.author }}</p>
        <p class="text-xs text-slate-400">
          {{ testimonial.role }}, {{ testimonial.company }}
        </p>
      </div>
    </figcaption>
  </figure>
</template>
