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
    wins: number;
    losses: number;
    winrate: number | null;
    matchesPlayed: number;
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
    lazy: false,
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
  <p v-else class="muted">Chargement de l'équipe...</p>
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

@media (max-width: 640px) {
  .card {
    padding: 18px;
  }
  .match-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>