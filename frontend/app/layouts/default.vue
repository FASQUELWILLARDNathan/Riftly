<script setup lang="ts">
const navigation = [
  { label: "Matchs", to: "/matchs" },
  { label: "Équipes", to: "/equipes" },
];
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
    </header>

    <main class="content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.shell { min-height: 100vh; display: flex; flex-direction: column; }
.nav { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; padding: 16px 32px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-base); }
.brand { color: var(--text-primary); font-size: 20px; font-weight: 700; letter-spacing: 0.03em; }
.brand-accent { color: var(--accent); }
.links { display: flex; gap: 24px; }
.links a { color: var(--text-secondary); font-size: 14px; font-weight: 500; }
.links a:hover, .links a.router-link-active { color: var(--text-primary); }
.content { flex: 1; width: 100%; max-width: 1160px; margin: 0 auto; padding: 32px; }
@media (max-width: 640px) { .nav { padding: 14px 16px; } .links { display: none; } .content { padding: 20px 16px; } }
</style>
