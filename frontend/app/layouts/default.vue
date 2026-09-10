<script setup lang="ts">
import ThemeToggle from "@/components/ThemeToggle.vue";
import UserMenu from "@/components/UserMenu.vue";
import { useAuthStore } from "@/stores/auth";

const navigation = [
  { label: "Matchs", to: "/matchs" },
  { label: "Équipes", to: "/equipes" },
];

const auth = useAuthStore();
</script>

<template>
  <div class="shell">
    <header class="nav">
      <NuxtLink to="/" class="brand font-display" aria-label="RiftData, accueil">
        RIFT<span class="brand-accent">DATA</span>
      </NuxtLink>

      <nav class="links" aria-label="Navigation principale">
        <NuxtLink v-for="item in navigation" :key="item.to" :to="item.to">{{ item.label }}</NuxtLink>
      </nav>

      <div class="actions">
        <ThemeToggle />
        <NuxtLink v-if="!auth.isAuthenticated" to="/connexion" class="login-btn">Connexion</NuxtLink>
        <UserMenu v-else />
      </div>
    </header>

    <main class="content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.shell { min-height: 100vh; display: flex; flex-direction: column; }
.nav { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 16px 32px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-base); }
.brand { color: var(--text-primary); font-size: 20px; font-weight: 700; letter-spacing: 0.03em; }
.brand-accent { color: var(--accent); }
.links { display: flex; gap: 24px; }
.links a { color: var(--text-secondary); font-size: 14px; font-weight: 500; }
.links a:hover, .links a.router-link-active { color: var(--text-primary); }
.actions { display: flex; align-items: center; gap: 14px; margin-left: auto; }
.login-btn { padding: 8px 16px; border-radius: var(--radius-sm); background: var(--accent); color: var(--accent-contrast); font-size: 14px; font-weight: 600; transition: background var(--transition-fast); }
.login-btn:hover { background: var(--accent-strong); }
.content { flex: 1; width: 100%; max-width: 1160px; margin: 0 auto; padding: 32px; }
@media (max-width: 640px) { .nav { padding: 14px 16px; gap: 12px; } .links { display: none; } .actions { gap: 8px; } .content { padding: 20px 16px; } }
</style>
