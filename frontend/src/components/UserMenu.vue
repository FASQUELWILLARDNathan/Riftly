<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();
const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);

function toggle() {
  open.value = !open.value;
}
function close() {
  open.value = false;
}

function handleClickOutside(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    close();
  }
}

async function logout() {
  close();
  await auth.logout();
  router.push("/");
}

onMounted(() => document.addEventListener("click", handleClickOutside));
onUnmounted(() => document.removeEventListener("click", handleClickOutside));
</script>

<template>
  <div class="user-menu" ref="rootRef">
    <button class="trigger" @click="toggle" :aria-expanded="open">
      <span class="avatar font-display">{{ auth.user?.username?.charAt(0).toUpperCase() }}</span>
      <span class="username font-mono">{{ auth.user?.username }}</span>
      <span class="chevron" :class="{ open }">▾</span>
    </button>

    <Transition name="dropdown">
      <div v-if="open" class="dropdown">
        <RouterLink to="/profil" class="item" @click="close">
          <span class="icon">👤</span> Mon profil
        </RouterLink>
        <RouterLink to="/profil/parametres" class="item" @click="close">
          <span class="icon">⚙️</span> Gestion du profil
        </RouterLink>
        <div class="divider"></div>
        <button class="item danger" @click="logout">
          <span class="icon">↪</span> Déconnexion
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.user-menu {
  position: relative;
}

.trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 6px 10px 6px 6px;
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}
.trigger:hover {
  border-color: var(--border-strong);
  background: var(--bg-hover);
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--accent);
  color: var(--accent-contrast);
  font-size: 12px;
  font-weight: 700;
}

.username {
  font-size: 13px;
  color: var(--text-primary);
}

.chevron {
  font-size: 10px;
  color: var(--text-tertiary);
  transition: transform var(--transition-fast);
}
.chevron.open {
  transform: rotate(180deg);
}

.dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 200px;
  background: var(--bg-surface-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: 6px;
  z-index: 20;
}

.item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: var(--font-body);
}
.item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.item.danger:hover {
  color: var(--color-loss);
}

.icon {
  font-size: 13px;
  width: 16px;
  text-align: center;
}

.divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 6px 4px;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
