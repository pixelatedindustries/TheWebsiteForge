// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: ["@vueuse/nuxt", "@vueuse/motion/nuxt", "@nuxt/fonts"],

  css: ["~/assets/css/main.css"],

  runtimeConfig: {
    // Server-only secrets (never exposed to the browser). Mapped from env:
    //   PAYSTACK_SECRET_KEY → paystackSecretKey
    paystackSecretKey: "",
    // Public base URL of the deployed site, used to build Paystack callback_url
    // and webhook-derived links. Mapped from NUXT_PUBLIC_SITE_URL.
    public: {
      // Mapped from NUXT_PUBLIC_FIREBASE_* env vars; safe to expose (public client config).
      firebase: {
        apiKey: "",
        authDomain: "",
        projectId: "",
        appId: "",
      },
      // Mapped from NUXT_PUBLIC_PAYSTACK_PUBLIC_KEY; safe to expose (publishable key).
      paystackPublicKey: "",
      // Mapped from NUXT_PUBLIC_SITE_URL, e.g. https://websiteforge.pixelatedindustries.com
      siteUrl: "",
      // USD→ZAR display rate (server charges via the same env rate). Mapped from
      // NUXT_PUBLIC_USD_TO_ZAR — keep in sync with the server-side USD_TO_ZAR.
      usdToZar: "17",
    },
  },

  vite: {
    plugins: [tailwindcss()],
    // Allow tunnel hosts (cloudflared/ngrok) to reach the dev server so Paystack
    // webhook + checkout testing works through a public HTTPS tunnel.
    server: {
      allowedHosts: [
        ".trycloudflare.com",
        ".ngrok-free.app",
        ".ngrok-free.dev",
        ".ngrok.app",
        ".ngrok.dev",
      ],
    },
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
      title: "TheWebsiteForge - Websites With Motion, Speed, and Bite",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "color-scheme", content: "dark" },
        {
          name: "description",
          content:
            "TheWebsiteForge builds premium, high-performance websites, animated brand systems, and polished digital launches.",
        },
        { name: "theme-color", content: "#05070d" },
        {
          property: "og:title",
          content: "TheWebsiteForge - Websites With Motion, Speed, and Bite",
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
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      // Daily at 06:00 — debit due recurring charges from customer wallets.
      "0 6 * * *": ["billing:charge-recurring"],
    },
  },
});
