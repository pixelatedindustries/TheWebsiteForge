<script setup lang="ts">
useSeoMeta({
  title: "Contact — Lumina Studio",
  description:
    "Start a project with Lumina Studio. Tell us what you're building and we'll reply within one business day.",
});

const highlights = [
  {
    title: "Fast replies",
    body: "We respond within one business day — usually much sooner.",
  },
  {
    title: "Buy or build",
    body: "Purchase a ready-made site or commission a fully custom one.",
  },
  {
    title: "No obligation",
    body: "Quotes are free. We'll tell you honestly if we're not the right fit.",
  },
];
</script>

<template>
  <div class="px-4 pt-36 pb-12 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-6xl">
      <div class="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <!-- left: pitch -->
        <div v-motion="reveal(0)">
          <span
            class="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-300"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-brand-400" />
            Get in touch
          </span>
          <h1
            class="mt-4 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl"
          >
            Let's build something
            <span class="text-gradient">worth selling.</span>
          </h1>
          <p class="mt-5 max-w-md text-lg leading-relaxed text-slate-400">
            Tell us about your project — goals, timeline, links. We'll get back
            with next steps and a clear quote.
          </p>

          <ul class="mt-10 space-y-5">
            <li
              v-for="(item, i) in highlights"
              :key="item.title"
              v-motion="reveal(i + 1)"
              class="flex items-start gap-4"
            >
              <span
                class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-600"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </span>
              <div>
                <p class="font-semibold text-white">{{ item.title }}</p>
                <p class="text-sm text-slate-400">{{ item.body }}</p>
              </div>
            </li>
          </ul>

          <div class="glass mt-10 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
            Prefer email?
            <a href="mailto:dummy@mail.com" class="font-medium text-brand-300 underline-offset-4 hover:underline">
              dummy@mail.com
            </a>
          </div>
        </div>

        <!-- right: form -->
        <div v-motion="reveal(1)">
          <ContactForm />
        </div>
      </div>
    </div>
  </div>
</template>
