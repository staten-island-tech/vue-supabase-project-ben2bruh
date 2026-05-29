export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxtjs/supabase", "@pinia/nuxt", "@nuxtjs/tailwindcss"],
  routeRules: {
    "/": { redirect: "/HomePage" },
  },
  supabase: {
    types: "../types/database.types.ts",
    redirectOptions: {
      login: "/LoginPage",
      callback: "/confirm",
      exclude: ["/HomePage", "/RegisterPage"],
    },
  },
});
