<script setup lang="ts">
import { onMounted } from "vue";
import ThemeToggle from "./components/ThemeToggle.vue";
import UserMenu from "./components/UserMenu.vue";
import { useAuthStore } from "./stores/auth";

const auth = useAuthStore();

onMounted(() => auth.checkSession());
</script>

<template>
  <div class="shell">
    <header class="nav">
      <RouterLink to="/" class="brand font-display">
        RIFT<span class="brand-accent">DATA</span>
      </RouterLink>

      <nav class="links">
        <RouterLink to="/matchs">Matchs</RouterLink>
        <RouterLink to="/equipes">Équipes</RouterLink>
      </nav>

      <div class="actions">
        <ThemeToggle />
        <RouterLink v-if="!auth.isAuthenticated" to="/connexion" class="login-btn">Connexion</RouterLink>
        <UserMenu v-else />
      </div>
    </header>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  background: var(--bg-base);
  z-index: 10;
}

.brand {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: var(--text-primary);
}
.brand-accent {
  color: var(--accent);
}

.links {
  display: flex;
  gap: 24px;
}
.links a {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  transition: color var(--transition-fast);
}
.links a:hover,
.links a.router-link-active {
  color: var(--text-primary);
}

.actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.login-btn {
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: var(--accent-contrast);
  font-weight: 600;
  font-size: 14px;
  transition: background var(--transition-fast);
}
.login-btn:hover {
  background: var(--accent-strong);
}

.content {
  flex: 1;
  max-width: 1160px;
  margin: 0 auto;
  width: 100%;
  padding: 32px;
}

@media (max-width: 640px) {
  .nav {
    padding: 14px 16px;
  }
  .links {
    display: none;
  }
  .content {
    padding: 20px 16px;
  }
}
</style>
