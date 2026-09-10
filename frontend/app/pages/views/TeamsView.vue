<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { api, assetUrl, type TeamSummary } from "../api/client";

const query = ref("");
const teams = ref<TeamSummary[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await api.teams.list(query.value || undefined);
    teams.value = data;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);

let debounce: ReturnType<typeof setTimeout>;
watch(query, () => {
  clearTimeout(debounce);
  debounce = setTimeout(load, 300);
});
</script>

<template>
  <div class="header">
    <h1 class="font-display">Équipes</h1>
    <input v-model="query" type="text" placeholder="Rechercher une équipe…" class="search" />
  </div>

  <p v-if="loading" class="muted">Chargement…</p>
  <p v-else-if="error" class="muted">{{ error }}</p>
  <p v-else-if="!teams.length" class="muted">Aucune équipe trouvée.</p>
  <div v-else class="grid">
    <RouterLink v-for="t in teams" :key="t.pageid" :to="`/equipes/${t.pageid}`" class="team-card">
      <img v-if="t.logourl" :src="assetUrl(t.logourl) ?? undefined" :alt="t.name" class="logo" />
      <div v-else class="logo logo-placeholder font-display">{{ t.name.charAt(0) }}</div>
      <div class="team-info">
        <span class="team-name">{{ t.name }}</span>
        <span class="team-region font-mono">{{ t.region ?? "—" }}</span>
      </div>
    </RouterLink>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.team-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 14px;
  transition: border-color var(--transition-fast), transform var(--transition-fast);
}
.team-card:hover {
  border-color: var(--border-strong);
  transform: translateY(-2px);
}

.logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: var(--radius-sm);
}
.logo-placeholder {
  display: grid;
  place-items: center;
  background: var(--bg-surface-raised);
  color: var(--color-gold);
  font-size: 18px;
  font-weight: 700;
}

.team-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}
.team-name {
  font-weight: 600;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.team-region {
  font-size: 11px;
  color: var(--text-tertiary);
}

.muted {
  color: var(--text-tertiary);
  font-size: 14px;
}
</style>
