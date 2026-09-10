<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { api, type MatchSummary } from "../api/client";
import MatchCard from "../components/MatchCard.vue";

const status = ref<"live" | "upcoming" | "finished">("upcoming");
const team = ref("");
const matches = ref<MatchSummary[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await api.matches.list(status.value, team.value ? { team: team.value } : {});
    matches.value = data;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(status, load);

let debounce: ReturnType<typeof setTimeout>;
watch(team, () => {
  clearTimeout(debounce);
  debounce = setTimeout(load, 350);
});
</script>

<template>
  <div class="header">
    <h1 class="font-display">Matchs</h1>
    <input v-model="team" type="text" placeholder="Filtrer par équipe…" class="search" />
  </div>

  <div class="tabs">
    <button :class="{ active: status === 'live' }" @click="status = 'live'">En direct</button>
    <button :class="{ active: status === 'upcoming' }" @click="status = 'upcoming'">À venir</button>
    <button :class="{ active: status === 'finished' }" @click="status = 'finished'">Terminés</button>
  </div>

  <p v-if="loading" class="muted">Chargement…</p>
  <p v-else-if="error" class="muted">{{ error }}</p>
  <p v-else-if="!matches.length" class="muted">Aucun match trouvé.</p>
  <div v-else class="grid">
    <MatchCard v-for="m in matches" :key="m.id" :match="m" />
  </div>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}
h1 {
  font-size: 28px;
  margin: 0;
}
.search {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  color: var(--text-primary);
  font-size: 14px;
  min-width: 220px;
}
.search:focus {
  border-color: var(--accent);
}

.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border-subtle);
}
.tabs button {
  background: none;
  border: none;
  padding: 10px 16px;
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--text-tertiary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}
.tabs button:hover {
  color: var(--text-secondary);
}
.tabs button.active {
  color: var(--accent);
  border-color: var(--accent);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.muted {
  color: var(--text-tertiary);
  font-size: 14px;
}
</style>
