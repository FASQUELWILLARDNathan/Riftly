function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
}

export default defineNuxtConfig({
  compatibilityDate: "2026-09-10",
  devtools: { enabled: true },
  modules: ["@pinia/nuxt"],
  css: ["~/styles/tokens.css"],
  runtimeConfig: {
    public: {
      apiBase: required("NUXT_PUBLIC_API_BASE"),
      siteUrl: required("NUXT_PUBLIC_SITE_URL"),
    },
  },
});
