<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, assetUrl } from "../api/client";

const props = defineProps<{ id: string }>();

const team = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    const { data } = await api.teams.detail(Number(props.id));
    team.value = data;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <p v-if="loading" class="muted">Chargement…</p>
  <p v-else-if="error" class="muted">{{ error }}</p>

  <template v-else-if="team">
    <div class="header">
      <img v-if="team.logourl" :src="assetUrl(team.logourl) ?? undefined" :alt="team.name" class="logo" />
      <div>
        <h1 class="font-display">{{ team.name }}</h1>
        <span class="region font-mono">{{ team.region ?? "Région inconnue" }}</span>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat">
        <span class="stat-value font-mono">{{ team.stats.wins }}</span>
        <span class="stat-label">Victoires</span>
      </div>
      <div class="stat">
        <span class="stat-value font-mono">{{ team.stats.losses }}</span>
        <span class="stat-label">Défaites</span>
      </div>
      <div class="stat">
        <span class="stat-value font-mono accent">{{ team.stats.winrate ?? "—" }}%</span>
        <span class="stat-label">Winrate</span>
      </div>
    </div>

    <section class="card">
      <h2 class="font-display">Effectif</h2>
      <p v-if="!team.players?.length" class="muted">Aucun joueur enregistré.</p>
      <div v-else class="roster">
        <RouterLink v-for="p in team.players" :key="p.pageid" :to="`/joueurs/${p.pageid}`" class="player">
          <span class="player-id font-display">{{ p.id }}</span>
          <span class="player-name muted">{{ p.name }}</span>
        </RouterLink>
      </div>
    </section>

    <section class="card">
      <h2 class="font-display">Derniers matchs</h2>
      <p v-if="!team.recentMatches?.length" class="muted">Aucun match récent.</p>
      <ul v-else class="match-list">
        <li v-for="m in team.recentMatches" :key="m.id">
          <span class="font-mono">{{ m.date ? new Date(m.date).toLocaleDateString("fr-FR") : "—" }}</span>
          <span>{{ m.teams?.join(" vs ") }}</span>
          <span class="muted">{{ m.tournament }}</span>
        </li>
      </ul>
    </section>
  </template>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.logo {
  width: 64px;
  height: 64px;
  object-fit: contain;
}
h1 {
  font-size: 28px;
  margin: 0 0 4px;
}
.region {
  color: var(--color-gold);
  font-size: 13px;
}

.stats-row {
  display: flex;
  gap: 32px;
  padding: 20px 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 24px;
}
.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat-value {
  font-size: 26px;
  font-weight: 700;
}
.stat-value.accent {
  color: var(--accent);
}
.stat-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 24px;
  margin-bottom: 20px;
}
.card h2 {
  font-size: 18px;
  margin: 0 0 16px;
}

.roster {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.player {
  padding: 12px;
  background: var(--bg-surface-raised);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.player-id {
  font-size: 16px;
  font-weight: 600;
}
.player-name {
  font-size: 12px;
}

.match-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.match-list li {
  display: grid;
  grid-template-columns: 90px 1fr auto;
  gap: 12px;
  font-size: 13px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
}

.muted {
  color: var(--text-tertiary);
  font-size: 14px;
}
</style>
