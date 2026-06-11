<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 34 });
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="shrink-0"
    role="img"
    aria-label="TheWebsiteForge logo"
  >
    <defs>
      <linearGradient id="lumina-grad" x1="6" y1="6" x2="42" y2="42">
        <stop stop-color="#34d8a6" />
        <stop offset="0.55" stop-color="#1f9bf0" />
        <stop offset="1" stop-color="#2563eb" />
      </linearGradient>
    </defs>
    <rect
      x="3"
      y="3"
      width="42"
      height="42"
      rx="13"
      fill="url(#lumina-grad)"
      fill-opacity="0.16"
      stroke="url(#lumina-grad)"
      stroke-width="1.5"
    />
    <path
      d="M24 11 L33 18 V30 L24 37 L15 30 V18 Z"
      stroke="url(#lumina-grad)"
      stroke-width="2.4"
      stroke-linejoin="round"
      fill="none"
    />
    <circle cx="24" cy="24" r="3.6" fill="url(#lumina-grad)" />
  </svg>
</template>
