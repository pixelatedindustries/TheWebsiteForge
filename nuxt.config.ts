// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import { buildContentSecurityPolicy } from "./shared/csp";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: [
    "@pinia/nuxt",
    "@vueuse/nuxt",
    "@vueuse/motion/nuxt",
    "@nuxt/fonts",
    "@nuxt/image",
  ],

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
      // clean modern sans for body + display (300/font-light is only ever used
      // on the serif, so Geist ships 400→700 only)
      { name: "Geist", provider: "google", weights: [400, 500, 600, 700] },
      // editorial monospaced labels
      { name: "Geist Mono", provider: "google", weights: [400, 500] },
      // high-contrast editorial serif — only ever rendered at font-light (300),
      // normal + italic, so we ship just that one weight
      {
        name: "Cormorant Garamond",
        provider: "google",
        weights: [300],
        styles: ["normal", "italic"],
      },
    ],
  },

  // Image optimization pipeline (IPX + sharp). Any raster art rendered through
  // <NuxtImg>/<NuxtPicture> is auto-served as WebP/AVIF with responsive sizes.
  image: {
    format: ["avif", "webp"],
    quality: 72,
    screens: {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },

  app: {
    pageTransition: { name: "page", mode: "out-in" },
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
        { name: "theme-color", content: "#0e0d0c" },
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

  // Baseline security headers applied to every response (defense-in-depth).
  // The CSP allowlists the third parties this app actually loads: Google Fonts,
  // Firebase Auth, and Paystack's hosted/inline checkout. HTML documents get a
  // stricter, nonce-based script-src (no 'unsafe-inline') via the `csp-nonce`
  // Nitro plugin, which overrides this baseline header per request.
  routeRules: {
    "/**": {
      headers: {
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Strict-Transport-Security":
          "max-age=63072000; includeSubDomains; preload",
        "Permissions-Policy":
          "camera=(), microphone=(), geolocation=(), interest-cohort=()",
        "Content-Security-Policy": buildContentSecurityPolicy(),
      },
    },
    // Static marketing/legal routes are content-only (data comes from the
    // compiled-in shared/site.ts), so prerender them for instant TTFB. Auth-gated
    // header bits are <ClientOnly>, so the static HTML hydrates correctly.
    "/about": { prerender: true },
    "/pricing": { prerender: true },
    "/showcase": { prerender: true },
    "/terms": { prerender: true },
    "/refund-policy": { prerender: true },
    "/hosting-agreement": { prerender: true },
  },
});
