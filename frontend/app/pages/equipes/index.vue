<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, type TeamSummary, assetUrl } from "@/api/client";

const siteUrl = useRuntimeConfig().public.siteUrl;

useSeoMeta({
  title: "Equipes LoL esport - RiftData",
  description: "Explore les equipes professionnelles de League of Legends et leurs statistiques.",
  ogTitle: "Equipes LoL esport - RiftData",
  ogDescription: "Explore les equipes professionnelles de League of Legends et leurs statistiques.",
  ogType: "website",
  ogUrl: () => `${siteUrl}/equipes`,
  twitterCard: "summary",
});

useHead({ link: [{ rel: "canonical", href: `${siteUrl}/equipes` }] });

const teams = ref<TeamSummary[]>([]);
const query = ref("");
const loading = ref(true);
const error = ref<string | null>(null);

async function loadTeams() {
  loading.value = true;
  error.value = null;

  try {
    const response = await api.teams.list(query.value.trim() || undefined);
    teams.value = response.data;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Impossible de charger les équipes.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadTeams);
</script>

<template>
  <section class="page-header">
    <p class="eyebrow font-mono">SCÈNE COMPÉTITIVE</p>
    <h1 class="font-display">Équipes</h1>
    <p class="intro">Recherche les équipes présentes dans les données de la plateforme.</p>
  </section>

  <form class="search" @submit.prevent="loadTeams">
    <label for="team-search">Rechercher une équipe</label>
    <div class="search-row">
      <input id="team-search" v-model="query" type="search" placeholder="Nom de l'équipe" />
      <button type="submit">Rechercher</button>
    </div>
  </form>

  <p v-if="loading" class="muted">Chargement des équipes...</p>
  <p v-else-if="error" class="message error">{{ error }} Vérifie que l'API backend tourne sur le port 4000.</p>
  <p v-else-if="!teams.length" class="muted">Aucune équipe trouvée.</p>
  <div v-else class="grid">
    <article v-for="team in teams" :key="team.pageid" class="team-card">
      <img v-if="assetUrl(team.logourl)" :src="assetUrl(team.logourl) ?? undefined" :alt="`Logo ${team.name}`" />
      <div>
        <h2 class="font-display">{{ team.name }}</h2>
        <p>{{ team.region ?? "Région inconnue" }}</p>
        <span class="status">{{ team.status ?? "Statut inconnu" }}</span>
      </div>
    </article>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 24px; }
.eyebrow { margin: 0 0 8px; color: var(--color-gold); font-size: 12px; letter-spacing: 0.12em; }
h1 { margin: 0 0 8px; font-size: 38px; }
.intro { max-width: 60ch; margin: 0; color: var(--text-secondary); }
.search { margin-bottom: 24px; }
.search label { display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 13px; }
.search-row { display: flex; gap: 8px; max-width: 560px; }
input { flex: 1; min-width: 0; padding: 10px 12px; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); background: var(--bg-surface); color: var(--text-primary); }
button { padding: 10px 14px; border: 1px solid var(--accent); border-radius: var(--radius-sm); background: var(--accent); color: var(--accent-contrast); cursor: pointer; font-weight: 600; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.team-card { display: flex; align-items: center; gap: 14px; min-height: 110px; padding: 18px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: var(--bg-surface); }
.team-card img { width: 56px; height: 56px; object-fit: contain; }
.team-card h2 { margin: 0 0 4px; font-size: 20px; }
.team-card p { margin: 0 0 8px; color: var(--text-secondary); font-size: 13px; }
.status { color: var(--text-tertiary); font-size: 12px; }
.muted, .message { color: var(--text-tertiary); font-size: 14px; }
.error { color: var(--color-loss); }
</style>
