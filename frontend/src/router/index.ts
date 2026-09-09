import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: () => import("../views/HomeView.vue") },
    { path: "/matchs", name: "matches", component: () => import("../views/MatchesView.vue") },
    { path: "/matchs/:id", name: "match-detail", component: () => import("../views/MatchDetailView.vue"), props: true },
    { path: "/equipes", name: "teams", component: () => import("../views/TeamsView.vue") },
    { path: "/equipes/:id", name: "team-detail", component: () => import("../views/TeamDetailView.vue"), props: true },
    { path: "/connexion", name: "login", component: () => import("../views/LoginView.vue") },
    { path: "/profil", name: "profile", component: () => import("../views/ProfileView.vue") },
    { path: "/profil/parametres", name: "profile-settings", component: () => import("../views/ProfileSettingsView.vue") },
  ],
});

export default router;
