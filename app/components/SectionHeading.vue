<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow?: string;
    title: string;
    subtitle?: string;
    align?: "left" | "center";
    /** "light" flips the palette for sections with a white background */
    tone?: "dark" | "light";
    /** small monospaced index, e.g. "03" */
    index?: string;
  }>(),
  {
    align: "left",
    tone: "dark",
    eyebrow: undefined,
    subtitle: undefined,
    index: undefined,
  },
);
</script>

<template>
  <div :class="align === 'center' ? 'mx-auto max-w-4xl text-center' : 'max-w-5xl'">
    <div
      v-if="eyebrow || index"
      v-reveal="{ y: 12, duration: 0.6 }"
      class="mb-8 flex items-center gap-4 font-mono text-xs uppercase tracking-[0.4em]"
      :class="[
        tone === 'light' ? 'text-black/50' : 'text-slate-500',
        align === 'center' ? 'justify-center' : '',
      ]"
    >
      <span v-if="index">({{ index }})</span>
      <span
        v-if="index && eyebrow"
        class="h-px w-10"
        :class="tone === 'light' ? 'bg-black/30' : 'bg-white/30'"
      />
      <span v-if="eyebrow">{{ eyebrow }}</span>
    </div>
    <h2
      v-lines="{ delay: 0.05 }"
      class="font-serif text-[clamp(2.25rem,5vw,4.5rem)] font-light leading-[1.05] tracking-[-0.01em]"
      :class="tone === 'light' ? 'text-[#1a1816]' : 'text-[#ece9e2]'"
    >
      {{ title }}
    </h2>
    <p
      v-if="subtitle"
      v-reveal="{ delay: 0.15 }"
      class="mt-10 max-w-lg text-lg leading-relaxed"
      :class="[
        tone === 'light' ? 'text-[#1a1816]/65' : 'text-slate-400',
        align === 'center' ? 'mx-auto' : '',
      ]"
    >
      {{ subtitle }}
    </p>
  </div>
</template>
