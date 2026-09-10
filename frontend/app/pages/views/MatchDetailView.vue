<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { api } from "../api/client";
import { useAuthStore } from "../stores/auth";

const props = defineProps<{ id: string }>();
const auth = useAuthStore();

const match = ref<any>(null);
const prediction = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const voting = ref(false);
const voteMessage = ref<string | null>(null);
const userVote = ref<1 | 2 | null>(null);

const teamA = computed(() => match.value?.teams?.[0] ?? "Équipe A");
const teamB = computed(() => match.value?.teams?.[1] ?? "Équipe B");

const formattedDate = computed(() => {
  if (!match.value?.date) return "Date à confirmer";
  return new Date(match.value.date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
});

async function load() {
  loading.value = true;
  error.value = null;
  try {
    await auth.checkSession();
    const [matchRes, predictionRes] = await Promise.all([
      api.matches.detail(props.id),
      api.predictions.get(props.id).catch(() => null), // pas grave si pas assez de données pour prédire
    ]);
    match.value = matchRes.data;
    prediction.value = predictionRes?.data ?? null;
    if (auth.isAuthenticated) {
      const voteRes = await api.predictions.myVote(props.id).catch(() => null);
      userVote.value = voteRes?.data?.predictedWinner ?? null;
      if (userVote.value) {
        voteMessage.value = `Tu as voté pour ${userVote.value === 1 ? teamA.value : teamB.value}.`;
      }
    }
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function vote(choice: 1 | 2) {
  if (!auth.isAuthenticated) {
    voteMessage.value = "Connecte-toi pour enregistrer ton pronostic.";
    return;
  }
  if (userVote.value) {
    voteMessage.value = `Tu as déjà voté pour ${userVote.value === 1 ? teamA.value : teamB.value}.`;
    return;
  }
  voting.value = true;
  try {
    await api.predictions.vote(props.id, choice);
    userVote.value = choice;
    voteMessage.value = "Pronostic enregistré !";
  } catch (e: any) {
    voteMessage.value = e.message;
  } finally {
    voting.value = false;
  }
}

onMounted(load);
</script>

<template>
  <p v-if="loading" class="muted">Chargement du match…</p>
  <p v-else-if="error" class="muted">{{ error }}</p>

  <template v-else-if="match">
    <div class="header">
      <span class="region font-mono">{{ match.region }}</span>
      <span class="tournament">{{ match.tournament }}</span>
      <span class="date font-mono">{{ formattedDate }}</span>
    </div>

    <div class="matchup">
      <div class="team-block" :class="{ winner: match.winner === '1' }">{{ teamA }}</div>
      <span class="vs font-display">VS</span>
      <div class="team-block" :class="{ winner: match.winner === '2' }">{{ teamB }}</div>
    </div>

    <!-- Prédiction statistique -->
    <section v-if="prediction" class="card prediction">
      <h2 class="font-display">Prédiction</h2>
      <p class="favored">
        Victoire estimée : <strong>{{ prediction.favoredTeam }}</strong>
        <span class="confidence font-mono">{{ prediction.confidence }}%</span>
      </p>

      <div class="reasons-grid">
        <div v-for="teamName in [teamA, teamB]" :key="teamName" class="reasons-col">
          <h3>{{ teamName }}</h3>
          <ul>
            <li v-for="(r, i) in prediction.reasons[teamName]" :key="i" :class="r.type">
              {{ r.type === "positive" ? "+" : "−" }} {{ r.label }}
            </li>
          </ul>
        </div>
      </div>

      <div class="vote-actions" v-if="!match.finished">
        <p class="vote-label">Ton pronostic :</p>
        <div class="vote-buttons">
          <button @click="vote(1)" :disabled="voting || userVote !== null" :class="{ selected: userVote === 1 }">
            {{ teamA }}<span v-if="userVote === 1"> — Ton vote</span>
          </button>
          <button @click="vote(2)" :disabled="voting || userVote !== null" :class="{ selected: userVote === 2 }">
            {{ teamB }}<span v-if="userVote === 2"> — Ton vote</span>
          </button>
        </div>
        <p v-if="voteMessage" class="vote-message">{{ voteMessage }}</p>
      </div>
    </section>
    <p v-else class="muted">Pas assez de données historiques pour générer une prédiction sur ce match.</p>

    <!-- Confrontations directes -->
    <section class="card">
      <h2 class="font-display">Confrontations directes</h2>
      <p v-if="!match.headToHead?.length" class="muted">Aucune confrontation directe enregistrée.</p>
      <ul v-else class="match-list">
        <li v-for="h in match.headToHead" :key="h.id">
          <span class="font-mono">{{ h.date ? new Date(h.date).toLocaleDateString("fr-FR") : "—" }}</span>
          <span>{{ h.teams?.join(" vs ") }}</span>
          <span class="muted">{{ h.tournament }}</span>
        </li>
      </ul>
    </section>

    <!-- Forme récente -->
    <section class="card">
      <h2 class="font-display">Forme récente</h2>
      <div class="form-grid">
        <div v-for="(games, name) in match.recentForm" :key="name" class="form-col">
          <h3>{{ name }}</h3>
          <div class="form-dots">
            <span
              v-for="(g, i) in games"
              :key="i"
              class="dot"
              :class="g.result === 'win' ? 'win' : 'loss'"
              :title="`${g.opponent} — ${g.result === 'win' ? 'Victoire' : 'Défaite'}`"
            ></span>
          </div>
        </div>
      </div>
    </section>
  </template>
</template>

<style scoped>
.header {
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}
.region {
  color: var(--color-gold);
}

.matchup {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 20px;
  padding: 32px 0;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 24px;
}
.team-block {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--text-secondary);
}
.team-block.winner {
  color: var(--text-primary);
}
.team-block:last-child {
  text-align: right;
}
.vs {
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

.favored {
  font-size: 16px;
  margin: 0 0 20px;
}
.confidence {
  margin-left: 10px;
  color: var(--accent);
  font-weight: 600;
}

.reasons-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.reasons-col h3 {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 8px;
}
.reasons-col ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}
.reasons-col li.positive {
  color: var(--color-win);
}
.reasons-col li.negative {
  color: var(--color-loss);
}

.vote-actions {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}
.vote-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 10px;
}
.vote-buttons {
  display: flex;
  gap: 10px;
}
.vote-buttons button {
  flex: 1;
  padding: 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-strong);
  background: var(--bg-surface-raised);
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 600;
  transition: border-color var(--transition-fast);
}
.vote-buttons button:hover {
  border-color: var(--accent);
}
.vote-buttons button.selected {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--accent-contrast);
}
.vote-message {
  margin-top: 10px;
  font-size: 13px;
  color: var(--text-secondary);
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

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.form-col h3 {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 10px;
}
.form-dots {
  display: flex;
  gap: 6px;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.dot.win {
  background: var(--color-win);
}
.dot.loss {
  background: var(--color-loss);
}

.muted {
  color: var(--text-tertiary);
  font-size: 14px;
}
</style>
