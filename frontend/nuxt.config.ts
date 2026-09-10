export default defineNuxtConfig({
  compatibilityDate: "2026-09-10",
  devtools: { enabled: true },
  css: ["~/styles/tokens.css"],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? "https://neyznn.fr/api",
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL ?? "https://neyznn.fr",
    },
  },
});
