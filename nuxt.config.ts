// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: ["@vueuse/nuxt", "@vueuse/motion/nuxt", "@nuxt/fonts"],

  css: ["~/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
  },

  fonts: {
    families: [
      { name: "Inter", provider: "google" },
      { name: "Space Grotesk", provider: "google" },
    ],
  },

  app: {
    pageTransition: false,
    head: {
      htmlAttrs: { lang: "en", class: "dark" },
      title: "YourWebsiteSource - Websites With Motion, Speed, and Bite",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "color-scheme", content: "dark" },
        {
          name: "description",
          content:
            "YourWebsiteSource builds premium, high-performance websites, animated brand systems, and polished digital launches.",
        },
        { name: "theme-color", content: "#05070d" },
        {
          property: "og:title",
          content: "YourWebsiteSource - Websites With Motion, Speed, and Bite",
        },
        {
          property: "og:description",
          content:
            "Premium websites with motion, performance, proof, and transparent pricing.",
        },
        { property: "og:type", content: "website" },
      ],
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
  },

  nitro: {
    storage: {
      leads: { driver: "fs", base: "./.data/leads" },
    },
  },
});
