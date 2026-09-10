import { defineStore } from "pinia";
import { api } from "@/api/client";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as null | { id: string; username: string; email: string },
    checkedSession: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
  },
  actions: {
    async login(email: string, password: string) {
      const { data } = await api.auth.login(email, password);
      this.user = data.user;
    },
    async register(email: string, username: string, password: string) {
      const { data } = await api.auth.register(email, username, password);
      this.user = data.user;
    },
    async logout() {
      await api.auth.logout();
      this.user = null;
    },
    setUser(user: { id: string; username: string; email: string }) {
      this.user = user;
    },
    /** Vérifie si un cookie de session valide existe déjà (ex: après un refresh de page). */
    async checkSession() {
      if (this.checkedSession) return;
      try {
        const { data } = await api.users.me();
        this.user = { id: data.id, username: data.username, email: data.email };
      } catch {
        this.user = null;
      } finally {
        this.checkedSession = true;
      }
    },
  },
});
