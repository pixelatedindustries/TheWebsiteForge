<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 34 });
</script>

<template>
  <svg
    :width="size * 0.72"
    :height="size"
    viewBox="0 0 360 500"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="brand-p-mark shrink-0"
    role="img"
    aria-label="TheWebsiteForge logo"
  >
    <path
      d="M112 35H164L154 92H102L112 35ZM83 112H139L126 183C123 201 132 210 151 210H222C248 210 266 192 266 166C266 141 248 124 222 124H146L157 63H224C294 63 342 105 342 166C342 229 294 272 224 272H139L101 465H35L83 112Z"
      fill="currentColor"
    />
  </svg>
</template>
