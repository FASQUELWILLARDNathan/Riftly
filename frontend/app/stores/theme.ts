import { defineStore } from "pinia";

export const useThemeStore = defineStore("theme", {
  state: () => ({
    theme: (import.meta.client ? localStorage.getItem("theme") : null) as "dark" | "light" ?? "dark",
  }),
  actions: {
    toggle() {
      this.theme = this.theme === "dark" ? "light" : "dark";
      this.apply();
    },
    apply() {
      if (!import.meta.client) return;
      document.documentElement.setAttribute("data-theme", this.theme);
      localStorage.setItem("theme", this.theme);
    },
  },
});
