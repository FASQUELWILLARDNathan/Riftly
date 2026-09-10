<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, type MatchSummary } from "@/api/client";
import MatchCard from "@/components/MatchCard.vue";

const siteUrl = useRuntimeConfig().public.siteUrl;

useSeoMeta({
  title: "RiftData - Stats et predictions LoL esport",
  description: "Resultats, statistiques, confrontations et predictions pour la scene competitive League of Legends.",
  ogTitle: "RiftData - Stats et predictions LoL esport",
  ogDescription: "Resultats, statistiques, confrontations et predictions pour la scene competitive League of Legends.",
  ogType: "website",
  ogUrl: siteUrl,
  twitterCard: "summary",
});

useHead({ link: [{ rel: "canonical", href: siteUrl }] });

const upcoming = ref<MatchSummary[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    const { data } = await api.matches.list("upcoming", {});
    upcoming.value = data.slice(0, 6);
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="hero">
    <p class="eyebrow font-mono">STATS · PRÉDICTIONS · PERFORMANCE</p>
    <h1 class="font-display">
      La donnée derrière chaque victoire<span class="accent">.</span>
    </h1>
    <p class="lead">
      Résultats, confrontations directes et prédictions statistiques pour la scène compétitive
      League of Legends — sans le bruit des articles.
    </p>

    <!-- RouterLink devient NuxtLink -->
    <NuxtLink to="/matchs" class="cta">Voir tous les matchs →</NuxtLink>
  </section>

  <section class="section">
    <div class="section-head">
      <h2 class="font-display">Prochains matchs</h2>
      <NuxtLink to="/matchs">Tout voir</NuxtLink>
    </div>

    <p v-if="loading" class="muted">Chargement des matchs…</p>
    <p v-else-if="error" class="muted">{{ error }}</p>
    <p v-else-if="!upcoming.length" class="muted">Aucun match à venir pour le moment.</p>

    <div v-else class="grid">
      <MatchCard v-for="m in upcoming" :key="m.id" :match="m" />
    </div>
  </section>
</template>

<style scoped>
.hero {
  padding: 48px 0 56px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 40px;
}
.eyebrow {
  color: var(--color-gold);
  font-size: 12px;
  letter-spacing: 0.12em;
  margin: 0 0 12px;
}
h1 {
  font-size: clamp(32px, 5vw, 52px);
  line-height: 1.05;
  margin: 0 0 16px;
  max-width: 16ch;
}
.accent {
  color: var(--accent);
}
.lead {
  color: var(--text-secondary);
  font-size: 16px;
  max-width: 52ch;
  margin: 0 0 24px;
}
.cta {
  display: inline-block;
  padding: 10px 20px;
  background: var(--accent);
  color: var(--accent-contrast);
  border-radius: var(--radius-sm);
  font-weight: 600;
  transition: background var(--transition-fast);
}
.cta:hover {
  background: var(--accent-strong);
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 18px;
}
.section-head h2 {
  font-size: 22px;
  margin: 0;
}
.section-head a {
  font-size: 13px;
  color: var(--text-secondary);
}
.section-head a:hover {
  color: var(--accent);
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
