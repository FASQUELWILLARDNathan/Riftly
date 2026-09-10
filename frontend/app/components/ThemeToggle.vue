<script setup lang="ts">
import { useThemeStore } from "../stores/theme";
const theme = useThemeStore();
</script>

<template>
  <button class="toggle" @click="theme.toggle()" :aria-label="'Passer en mode ' + (theme.theme === 'dark' ? 'clair' : 'sombre')">
    <span v-if="theme.theme === 'dark'">☀️</span>
    <span v-else>🌙</span>
  </button>
</template>

<style scoped>
.toggle {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 15px;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}
.toggle:hover {
  border-color: var(--border-strong);
  background: var(--bg-hover);
}
</style>
