<script setup lang="ts">
import { testimonials } from "~~/shared/site";
</script>

<template>
  <section class="px-4 py-20 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl">
      <SectionHeading
        eyebrow="Proof"
        title="Clients who'd hire us again"
        subtitle="Don't take our word for it — here's what founders and teams say after launch."
      />

      <div
        v-reveal:stagger="{ selector: '.t-card', stagger: 0.1, y: 44 }"
        v-skew
        class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div
          v-for="t in testimonials"
          :key="t.author"
          v-tilt="{ max: 7 }"
          class="t-card"
        >
          <TestimonialCard :testimonial="t" />
        </div>
      </div>
    </div>
  </section>
</template>
