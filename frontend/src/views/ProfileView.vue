<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { api, assetUrl } from "../api/client";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();

const profile = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const memberSince = computed(() => {
  if (!profile.value?.createdAt) return "—";
  return new Date(profile.value.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
});

const daysSinceMember = computed(() => {
  if (!profile.value?.createdAt) return 0;
  const diff = Date.now() - new Date(profile.value.createdAt).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

onMounted(async () => {
  if (!auth.isAuthenticated) {
    router.push("/connexion");
    return;
  }
  try {
    const { data } = await api.users.me();
    profile.value = data;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <p v-if="loading" class="muted">Chargement du profil…</p>
  <p v-else-if="error" class="muted">{{ error }}</p>

  <template v-else-if="profile">
    <div class="header">
      <span class="avatar font-display">{{ profile.username.charAt(0).toUpperCase() }}</span>
      <div>
        <h1 class="font-display">{{ profile.username }}</h1>
        <span class="member-since font-mono">Membre depuis le {{ memberSince }} · {{ daysSinceMember }} jours</span>
      </div>
    </div>

    <section class="card">
      <h2 class="font-display">Statistiques de prédiction</h2>
      <div class="stats-row">
        <div class="stat">
          <span class="stat-value font-mono accent">{{ profile.predictionStats.successRate ?? "—" }}%</span>
          <span class="stat-label">Taux de réussite</span>
        </div>
        <div class="stat">
          <span class="stat-value font-mono">{{ profile.predictionStats.correct }}</span>
          <span class="stat-label">Prédictions correctes</span>
        </div>
        <div class="stat">
          <span class="stat-value font-mono">{{ profile.predictionStats.settled }}</span>
          <span class="stat-label">Prédictions arbitrées</span>
        </div>
        <div class="stat">
          <span class="stat-value font-mono">{{ profile.predictionStats.total }}</span>
          <span class="stat-label">Prédictions totales</span>
        </div>
      </div>
      <p v-if="!profile.predictionStats.settled" class="muted hint">
        Aucune prédiction encore arbitrée — vote sur un match pour commencer ton historique.
      </p>
    </section>

    <section class="card">
      <h2 class="font-display">Équipes favorites</h2>
      <p v-if="!profile.favoriteTeams?.length" class="muted">
        Aucune équipe favorite pour l'instant. Ajoute-en depuis une page équipe.
      </p>
      <div v-else class="favorites">
        <RouterLink v-for="t in profile.favoriteTeams" :key="t.pageid" :to="`/equipes/${t.pageid}`" class="favorite">
          <img v-if="t.logourl" :src="assetUrl(t.logourl) ?? undefined" :alt="t.name" class="favorite-logo" />
          <span>{{ t.name }}</span>
        </RouterLink>
      </div>
    </section>
  </template>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
}
.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--accent);
  color: var(--accent-contrast);
  font-size: 22px;
  font-weight: 700;
}
h1 {
  font-size: 24px;
  margin: 0 0 4px;
}
.member-since {
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

.stats-row {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
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
.hint {
  margin-top: 16px;
  margin-bottom: 0;
}

.favorites {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.favorite {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg-surface-raised);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-primary);
}
.favorite-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.muted {
  color: var(--text-tertiary);
  font-size: 14px;
}
</style>
