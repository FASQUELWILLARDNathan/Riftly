<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, type MatchSummary } from "@/api/client";
import MatchCard from "@/components/MatchCard.vue";

const siteUrl = useRuntimeConfig().public.siteUrl;

useSeoMeta({
  title: "Matchs LoL esport - RiftData",
  description: "Calendrier des matchs League of Legends : matchs a venir, en direct et termines.",
  ogTitle: "Matchs LoL esport - RiftData",
  ogDescription: "Calendrier des matchs League of Legends : matchs a venir, en direct et termines.",
  ogType: "website",
  ogUrl: () => `${siteUrl}/matchs`,
  twitterCard: "summary",
});

useHead({ link: [{ rel: "canonical", href: `${siteUrl}/matchs` }] });

const matches = ref<MatchSummary[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const status = ref<"upcoming" | "live" | "finished">("upcoming");

async function loadMatches() {
  loading.value = true;
  error.value = null;

  try {
    const response = await api.matches.list(status.value);
    matches.value = response.data;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Impossible de charger les matchs.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadMatches);
</script>

<template>
  <section class="page-header">
    <p class="eyebrow font-mono">CALENDRIER ESPORT</p>
    <h1 class="font-display">Matchs</h1>
    <p class="intro">Consulte les matchs League of Legends par statut et ouvre une fiche pour accéder aux statistiques.</p>
  </section>

  <div class="filters" role="group" aria-label="Filtrer les matchs">
    <button
      v-for="option in [
        { label: 'À venir', value: 'upcoming' },
        { label: 'En direct', value: 'live' },
        { label: 'Terminés', value: 'finished' },
      ]"
      :key="option.value"
      class="filter"
      :class="{ active: status === option.value }"
      type="button"
      @click="status = option.value; loadMatches()"
    >
      {{ option.label }}
    </button>
  </div>

  <p v-if="loading" class="muted">Chargement des matchs...</p>
  <p v-else-if="error" class="message error">{{ error }} Vérifie que l'API backend tourne sur le port 4000.</p>
  <p v-else-if="!matches.length" class="muted">Aucun match dans cette catégorie.</p>
  <div v-else class="grid">
    <MatchCard v-for="match in matches" :key="match.id" :match="match" />
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 24px; }
.eyebrow { margin: 0 0 8px; color: var(--color-gold); font-size: 12px; letter-spacing: 0.12em; }
h1 { margin: 0 0 8px; font-size: 38px; }
.intro { max-width: 60ch; margin: 0; color: var(--text-secondary); }
.filters { display: flex; gap: 8px; margin-bottom: 24px; }
.filter { padding: 8px 14px; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); background: var(--bg-surface); color: var(--text-secondary); cursor: pointer; }
.filter:hover, .filter.active { border-color: var(--accent); color: var(--text-primary); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.muted, .message { color: var(--text-tertiary); font-size: 14px; }
.error { color: var(--color-loss); }
</style>
