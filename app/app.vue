<script setup lang="ts">
import { supportEmail } from "~~/shared/site";

// Site-wide structured data. `url` resolves from the `site` config, so these
// only need the brand-specific bits. Per-page WebPage/Breadcrumb schema is added
// automatically by nuxt-schema-org on top of this.
useSchemaOrg([
  defineOrganization({
    name: "TheWebsiteForge",
    logo: "/logo.svg",
    description:
      "TheWebsiteForge designs, builds, launches, and supports premium, high-performance websites without lock-in.",
    email: supportEmail,
  }),
  defineWebSite({ name: "TheWebsiteForge" }),
]);

// Default branded OG card for every route. Each page's resolved title +
// description are injected into the Forge template automatically; individual
// pages can override with their own defineOgImageComponent() call.
defineOgImageComponent("Forge");

// Pages already self-brand their titles (e.g. "About — TheWebsiteForge"), so
// use the page title verbatim instead of letting the SEO suite append the site
// name a second time. Falls back to the brand name for any untitled route.
useHead({
  titleTemplate: (title) => title || "TheWebsiteForge",
});
</script>

<template>
  <div>
    <AppLoader />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
