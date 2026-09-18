<script setup lang="ts">
import { assetUrl } from "@/api/client";

interface TeamPlayer {
  pageid: string;
  id: string;
  name: string;
}

interface TeamMatch {
  id: string;
  date: string | null;
  tournament: string | null;
  finished: boolean | null;
  winner: string | null;
  teams: string[];
}

interface TeamDetail {
  pageid: number;
  name: string;
  region: string | null;
  logourl: string | null;
  logodarkurl: string | null;
  textlesslogourl: string | null;
  textlesslogodarkurl: string | null;
  status: string | null;
  players: TeamPlayer[];
  stats: {
    currentYear: {
      wins: number;
      losses: number;
      winrate: number | null;
      matchesPlayed: number;
    };
    global: {
      wins: number;
      losses: number;
      winrate: number | null;
      matchesPlayed: number;
    };
  };
  recentMatches: TeamMatch[];
}

interface ApiResponse<T> {
  data: T;
}

const route = useRoute();
const config = useRuntimeConfig();
const teamId = computed(() => String(route.params.id));
const apiBase = String(config.public.apiBase).replace(/\/$/, "");

const { data: response, error } = await useFetch<ApiResponse<TeamDetail>>(
  () => `${apiBase}/teams/${encodeURIComponent(teamId.value)}`,
  {
    key: () => `team-${teamId.value}`,
    server: true,
    lazy: true,
  }
);

const team = computed(() => response.value?.data ?? null);

const pageTitle = computed(() => {
  if (!team.value) return "Équipe introuvable | RiftData";
  return `${team.value.name} — statistiques et effectif | RiftData`;
});

const pageDescription = computed(() => {
  if (!team.value) return "Consultez les statistiques des équipes League of Legends e-sport sur RiftData.";
  return `Winrate, effectif et derniers matchs de ${team.value.name}${team.value.region ? ` (${team.value.region})` : ""}.`;
});

const currentYear = new Date().getFullYear();

useSeoMeta({
  title: () => pageTitle.value,
  description: () => pageDescription.value,
  ogTitle: () => pageTitle.value,
  ogDescription: () => pageDescription.value,
  ogType: "profile",
  twitterCard: "summary",
});

useHead(() => ({
  link: [{ rel: "canonical", href: `${config.public.siteUrl}/equipes/${encodeURIComponent(teamId.value)}` }],
}));
</script>

<template>
  <article v-if="team" class="team-page">
    <header class="header">
      <TeamLogo
        :name="team.name"
        :logourl="assetUrl(team.logourl)"
        :logodarkurl="assetUrl(team.logodarkurl)"
        :textlesslogourl="assetUrl(team.textlesslogourl)"
        :textlesslogodarkurl="assetUrl(team.textlesslogodarkurl)"
        :size="64"
      />
      <div>
        <h1 class="font-display">{{ team.name }}</h1>
        <span class="region font-mono">{{ team.region ?? "Région inconnue" }}</span>
      </div>
    </header>

    <div class="stats-row">
      <!-- Année courante -->
      <div class="stats-group">
        <h2 class="stats-title font-display">
          Winrate {{ currentYear }}
        </h2>

        <div class="stats-items">
          <div class="stat">
            <span class="stat-value font-mono">
              {{ team.stats.currentYear.wins }}
            </span>
            <span class="stat-label">Victoires</span>
          </div>

          <div class="stat">
            <span class="stat-value font-mono">
              {{ team.stats.currentYear.losses }}
            </span>
            <span class="stat-label">Défaites</span>
          </div>

          <div class="stat">
            <span class="stat-value font-mono accent">
              {{ team.stats.currentYear.winrate ?? "—" }}%
            </span>
            <span class="stat-label">Winrate</span>
          </div>
        </div>
      </div>

      <!-- Global -->
      <div class="stats-group">
        <h2 class="stats-title font-display">
          Winrate global
        </h2>

        <div class="stats-items">
          <div class="stat">
            <span class="stat-value font-mono">
              {{ team.stats.global.wins }}
            </span>
            <span class="stat-label">Victoires</span>
          </div>

          <div class="stat">
            <span class="stat-value font-mono">
              {{ team.stats.global.losses }}
            </span>
            <span class="stat-label">Défaites</span>
          </div>

          <div class="stat">
            <span class="stat-value font-mono accent">
              {{ team.stats.global.winrate ?? "—" }}%
            </span>
            <span class="stat-label">Winrate</span>
          </div>
        </div>
      </div>
    </div>

    <section class="card" aria-labelledby="roster-title">
      <h2 id="roster-title" class="font-display">Effectif</h2>
      <p v-if="!team.players?.length" class="muted">Aucun joueur enregistré.</p>
      <div v-else class="roster">
        <NuxtLink v-for="p in team.players" :key="p.pageid" :to="`/joueurs/${p.pageid}`" class="player">
          <span class="player-id font-display">{{ p.id }}</span>
          <span class="player-name muted">{{ p.name }}</span>
        </NuxtLink>
      </div>
    </section>

    <section class="card" aria-labelledby="recent-matches-title">
      <h2 id="recent-matches-title" class="font-display">Derniers matchs</h2>
      <p v-if="!team.recentMatches?.length" class="muted">Aucun match récent.</p>
      <ul v-else class="match-list">
        <li v-for="m in team.recentMatches" :key="m.id">
          <NuxtLink :to="`/matchs/${m.id}`" class="match-row">
            <time class="font-mono" :datetime="m.date ?? undefined">
              {{ m.date ? new Date(m.date).toLocaleDateString("fr-FR") : "—" }}
            </time>
            <span>{{ m.teams.join(" vs ") }}</span>
            <span class="muted">{{ m.tournament }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </article>

  <p v-else-if="error" class="muted">{{ error.message }}</p>
  <article v-else class="team-page loading-page" aria-busy="true" aria-label="Chargement de l'équipe">
    <header class="header">
      <span class="loading-block loading-logo" aria-hidden="true"></span>
      <div class="loading-heading" aria-hidden="true">
        <span class="loading-block loading-title"></span>
        <span class="loading-block loading-region"></span>
      </div>
    </header>

    <div class="stats-row loading-stats" aria-hidden="true">
      <div v-for="group in 2" :key="group" class="stats-group">
        <span class="loading-block loading-stat-title"></span>
        <div class="stats-items">
          <span v-for="stat in 3" :key="stat" class="loading-stat">
            <span class="loading-block loading-value"></span>
            <span class="loading-block loading-label"></span>
          </span>
        </div>
      </div>
    </div>

    <section v-for="section in 2" :key="section" class="card loading-card" aria-hidden="true">
      <span class="loading-block loading-section-title"></span>
      <span v-for="row in 3" :key="row" class="loading-block loading-row"></span>
    </section>
  </article>
</template>

<style scoped>
.team-page {
  width: 100%;
}
.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
h1 {
  margin: 0 0 4px;
  font-size: 28px;
}
.region {
  color: var(--color-gold);
  font-size: 13px;
}

.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 20px 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 24px;
}

.stats-group {
  min-width: 0;
}

.stats-group + .stats-group {
  border-left: 1px solid var(--border-subtle);
  padding-left: 24px;
}

.stats-title {
  margin: 0 0 16px;
  font-size: 16px;
}

.stats-items {
  display: flex;
  gap: 32px;
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
  margin-bottom: 20px;
  padding: 24px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
}
.card h2 {
  margin: 0 0 16px;
  font-size: 18px;
}

.roster {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.player {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-surface-raised);
}
.player-id {
  font-size: 16px;
  font-weight: 600;
}
.player-name {
  font-size: 12px;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}
.match-row {
  display: grid;
  grid-template-columns: 90px 1fr auto;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 13px;
  color: var(--text-primary);
}

.muted {
  color: var(--text-tertiary);
  font-size: 14px;
}

.loading-page {
  pointer-events: none;
}

.loading-block {
  display: block;
  border-radius: var(--radius-sm);
  background: var(--bg-surface-raised);
  filter: blur(5px);
  opacity: 0.72;
  animation: loading-pulse 1.3s ease-in-out infinite alternate;
}

.loading-logo {
  width: 64px;
  height: 64px;
}

.loading-heading {
  display: grid;
  gap: 8px;
}

.loading-title {
  width: 190px;
  height: 28px;
}

.loading-region {
  width: 72px;
  height: 13px;
}

.loading-stat-title {
  width: 120px;
  height: 18px;
  margin-bottom: 16px;
}

.loading-stat {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.loading-value {
  width: 42px;
  height: 28px;
}

.loading-label {
  width: 54px;
  height: 12px;
}

.loading-card {
  display: grid;
  gap: 12px;
}

.loading-section-title {
  width: 110px;
  height: 20px;
  margin-bottom: 4px;
}

.loading-row {
  width: 100%;
  height: 38px;
}

@keyframes loading-pulse {
  from { opacity: 0.48; }
  to { opacity: 0.9; }
}

@media (max-width: 640px) {
  .stats-row {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .stats-group + .stats-group {
    border-left: none;
    border-top: 1px solid var(--border-subtle);
    padding-left: 0;
    padding-top: 20px;
  }

  .stats-items {
    gap: 24px;
  }

  .card {
    padding: 18px;
  }

  .match-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>