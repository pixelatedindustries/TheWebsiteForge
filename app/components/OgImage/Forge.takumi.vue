<script setup lang="ts">
/**
 * Social share card (1200x630) rendered by nuxt-og-image via Satori.
 * `title` and `description` are injected automatically from each page's
 * resolved SEO meta, so every page gets a branded card with its own copy.
 * Uses inline styles only (Satori supports a flexbox subset, not scoped CSS).
 */
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
  }>(),
  {
    title: "TheWebsiteForge",
    description:
      "Premium, high-performance websites with motion, speed, and bite.",
  },
);
</script>

<template>
  <div
    style="
      width: 1200px;
      height: 630px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 80px;
      background-image: radial-gradient(
          circle at 78% 28%,
          rgba(120, 110, 255, 0.18),
          transparent 55%
        ),
        linear-gradient(135deg, #0e0d0c 0%, #16140f 100%);
      color: #ece9e2;
      font-family: 'Geist', sans-serif;
    "
  >
    <!-- Brand lockup: logo mark + wordmark -->
    <div style="display: flex; align-items: center;">
      <svg
        width="58"
        height="80"
        viewBox="0 0 360 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M112 35H164L154 92H102L112 35ZM83 112H139L126 183C123 201 132 210 151 210H222C248 210 266 192 266 166C266 141 248 124 222 124H146L157 63H224C294 63 342 105 342 166C342 229 294 272 224 272H139L101 465H35L83 112Z"
          fill="#ffffff"
        />
      </svg>
      <span
        style="
          margin-left: 22px;
          font-size: 30px;
          font-weight: 700;
          letter-spacing: -0.5px;
        "
        >TheWebsiteForge</span
      >
    </div>

    <!-- Page title + description -->
    <div style="display: flex; flex-direction: column;">
      <div
        style="
          font-size: 68px;
          font-weight: 700;
          line-height: 1.05;
          letter-spacing: -1.5px;
          max-width: 1000px;
        "
      >
        {{ title }}
      </div>
      <div
        v-if="description"
        style="
          margin-top: 28px;
          font-size: 30px;
          line-height: 1.4;
          color: #a8a29e;
          max-width: 920px;
        "
      >
        {{ description }}
      </div>
    </div>

    <!-- Footer accent + domain -->
    <div style="display: flex; align-items: center;">
      <div
        style="
          width: 64px;
          height: 6px;
          border-radius: 9999px;
          background-image: linear-gradient(90deg, #8b85ff, #d97757);
        "
      />
      <span style="margin-left: 20px; font-size: 24px; color: #78716c;"
        >websiteforge.pixelatedindustries.com</span
      >
    </div>
  </div>
</template>
