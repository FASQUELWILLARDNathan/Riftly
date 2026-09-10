<script setup lang="ts">
import { api, ApiError } from "@/api/client";

interface MatchSummary {
  id: string;
  date: string | null;
  tournament: string | null;
  region: string;
  status: string | null;
  finished: boolean | null;
  winner: string | null;
  bestOf: number | null;
  teams: string[];
}

interface MatchHistory extends MatchSummary {
  opponents?: unknown;
}

interface RecentGame {
  matchId: string;
  date: string | null;
  tournament: string | null;
  opponent: string;
  result: "win" | "loss";
}

interface MatchDetail extends MatchSummary {
  headToHead?: MatchHistory[];
  recentForm?: Record<string, RecentGame[]>;
}

interface ApiResponse<T> {
  data: T;
}

interface Prediction {
  favoredTeam: string;
  confidence: number;
  reasons: Record<string, Array<{ type: "positive" | "negative"; label: string }>>;
}

const route = useRoute();
const config = useRuntimeConfig();
const matchId = computed(() => String(route.params.id));
const apiBase = String(config.public.apiBase).replace(/\/$/, "");

const { data: matchResponse, error: matchError } = await useFetch<ApiResponse<MatchDetail>>(
  () => `${apiBase}/matches/${encodeURIComponent(matchId.value)}`,
  {
    key: () => `match-${matchId.value}`,
    server: true,
    lazy: false,
  },
);

const match = computed(() => matchResponse.value?.data ?? null);
const teamA = computed(() => match.value?.teams[0] ?? "Équipe A");
const teamB = computed(() => match.value?.teams[1] ?? "Équipe B");

const { data: predictionResponse } = await useFetch<ApiResponse<Prediction>>(
  () => `${apiBase}/predictions/${encodeURIComponent(matchId.value)}`,
  {
    key: () => `prediction-${matchId.value}`,
    server: true,
    lazy: false,
    ignoreResponseError: true,
  },
);

const prediction = computed(() => predictionResponse.value?.data ?? null);
const userVote = ref<1 | 2 | null>(null);
const voting = ref(false);
const voteMessage = ref<string | null>(null);

const formattedDate = computed(() => {
  if (!match.value?.date) return "Date à confirmer";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(match.value.date));
});

const pageTitle = computed(() => {
  if (!match.value) return "Match e-sport introuvable | RiftData";
  return `${teamA.value} vs ${teamB.value} : statistiques du match | RiftData`;
});

const pageDescription = computed(() => {
  if (!match.value) return "Consultez les statistiques des matchs de League of Legends e-sport sur RiftData.";
  const tournament = match.value.tournament ? ` dans ${match.value.tournament}` : "";
  return `Statistiques, forme récente et confrontations de ${teamA.value} contre ${teamB.value}${tournament}.`;
});

useSeoMeta({
  title: () => pageTitle.value,
  description: () => pageDescription.value,
  ogTitle: () => pageTitle.value,
  ogDescription: () => pageDescription.value,
  ogType: "article",
  ogImage: () => `${config.public.siteUrl}/og/match/${encodeURIComponent(matchId.value)}.png`,
  twitterCard: "summary_large_image",
});

useHead(() => ({
  link: [{ rel: "canonical", href: `${config.public.siteUrl}/matchs/${encodeURIComponent(matchId.value)}` }],
}));

async function vote(choice: 1 | 2) {
  if (userVote.value) {
    voteMessage.value = `Tu as déjà voté pour ${userVote.value === 1 ? teamA.value : teamB.value}.`;
    return;
  }

  voting.value = true;
  voteMessage.value = null;
  try {
    await api.predictions.vote(matchId.value, choice);
    userVote.value = choice;
    voteMessage.value = "Pronostic enregistré !";
  } catch (error) {
    voteMessage.value = error instanceof ApiError && error.status === 401
      ? "Connecte-toi pour enregistrer ton pronostic."
      : "Impossible d'enregistrer le pronostic pour le moment.";
  } finally {
    voting.value = false;
  }
}
</script>

<template>
  <article v-if="match" class="match-page">
    <header class="header">
      <span class="region font-mono">{{ match.region }}</span>
      <span class="tournament">{{ match.tournament }}</span>
      <time v-if="match.date" class="date font-mono" :datetime="match.date">{{ formattedDate }}</time>
    </header>

    <div class="matchup" aria-label="Affiche du match">
      <div class="team-block" :class="{ winner: match.winner === '1' }">{{ teamA }}</div>
      <span class="vs font-display">VS</span>
      <div class="team-block" :class="{ winner: match.winner === '2' }">{{ teamB }}</div>
    </div>

    <section v-if="prediction" class="card prediction" aria-labelledby="prediction-title">
      <h1 id="prediction-title" class="font-display">Prédiction statistique</h1>
      <p class="favored">
        Victoire estimée : <strong>{{ prediction.favoredTeam }}</strong>
        <span class="confidence font-mono">{{ prediction.confidence }}%</span>
      </p>

      <div class="reasons-grid">
        <div v-for="teamName in [teamA, teamB]" :key="teamName" class="reasons-col">
          <h2>{{ teamName }}</h2>
          <ul>
            <li v-for="(reason, index) in prediction.reasons[teamName] ?? []" :key="index" :class="reason.type">
              {{ reason.type === "positive" ? "+" : "−" }} {{ reason.label }}
            </li>
          </ul>
        </div>
      </div>

      <div v-if="!match.finished" class="vote-actions">
        <p class="vote-label">Ton pronostic :</p>
        <div class="vote-buttons">
          <button :disabled="voting || userVote !== null" :class="{ selected: userVote === 1 }" @click="vote(1)">
            {{ teamA }}<span v-if="userVote === 1"> — Ton vote</span>
          </button>
          <button :disabled="voting || userVote !== null" :class="{ selected: userVote === 2 }" @click="vote(2)">
            {{ teamB }}<span v-if="userVote === 2"> — Ton vote</span>
          </button>
        </div>
        <p v-if="voteMessage" class="vote-message" aria-live="polite">{{ voteMessage }}</p>
      </div>
    </section>

    <p v-else class="muted">Pas assez de données historiques pour générer une prédiction sur ce match.</p>

    <section class="card" aria-labelledby="head-to-head-title">
      <h2 id="head-to-head-title" class="font-display">Confrontations directes</h2>
      <p v-if="!match.headToHead?.length" class="muted">Aucune confrontation directe enregistrée.</p>
      <ul v-else class="match-list">
        <li v-for="history in match.headToHead" :key="history.id">
          <time class="font-mono" :datetime="history.date ?? undefined">
            {{ history.date ? new Date(history.date).toLocaleDateString("fr-FR") : "—" }}
          </time>
          <span>{{ history.teams.join(" vs ") }}</span>
          <span class="muted">{{ history.tournament }}</span>
        </li>
      </ul>
    </section>

    <section class="card" aria-labelledby="recent-form-title">
      <h2 id="recent-form-title" class="font-display">Forme récente</h2>
      <div class="form-grid">
        <div v-for="(games, name) in match.recentForm ?? {}" :key="name" class="form-col">
          <h3>{{ name }}</h3>
          <div class="form-dots">
            <span
              v-for="game in games"
              :key="game.matchId"
              class="dot"
              :class="game.result === 'win' ? 'win' : 'loss'"
              :title="`${game.opponent} — ${game.result === 'win' ? 'Victoire' : 'Défaite'}`"
            />
          </div>
        </div>
      </div>
    </section>
  </article>

  <p v-else-if="matchError" class="muted">{{ matchError.message }}</p>
  <p v-else class="muted">Chargement du match...</p>
</template>

<style scoped>
.match-page { width: 100%; }
.header { display: flex; gap: 16px; align-items: center; margin-bottom: 16px; color: var(--text-secondary); font-size: 13px; }
.region { color: var(--color-gold); }
.matchup { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 20px; padding: 32px 0; border-bottom: 1px solid var(--border-subtle); margin-bottom: 24px; }
.team-block { color: var(--text-secondary); font-family: var(--font-display); font-size: 28px; font-weight: 700; }
.team-block.winner { color: var(--text-primary); }
.team-block:last-child { text-align: right; }
.vs { color: var(--text-tertiary); }
.card { margin-bottom: 20px; padding: 24px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: var(--bg-surface); }
.card h1, .card h2 { margin: 0 0 16px; font-size: 18px; }
.favored { margin: 0 0 20px; font-size: 16px; }
.confidence { margin-left: 10px; color: var(--accent); font-weight: 600; }
.reasons-grid, .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.reasons-col h2, .form-col h3 { margin: 0 0 8px; color: var(--text-secondary); font-size: 14px; }
.reasons-col ul, .match-list { display: flex; flex-direction: column; gap: 10px; padding: 0; margin: 0; list-style: none; }
.reasons-col ul { gap: 6px; font-size: 13px; }
.reasons-col li.positive { color: var(--color-win); }
.reasons-col li.negative { color: var(--color-loss); }
.vote-actions { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-subtle); }
.vote-label { margin: 0 0 10px; color: var(--text-secondary); font-size: 13px; }
.vote-buttons { display: flex; gap: 10px; }
.vote-buttons button { flex: 1; padding: 10px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); background: var(--bg-surface-raised); color: var(--text-primary); cursor: pointer; font-weight: 600; }
.vote-buttons button.selected { border-color: var(--accent); background: var(--accent); color: var(--accent-contrast); }
.vote-message { margin-top: 10px; color: var(--text-secondary); font-size: 13px; }
.match-list li { display: grid; grid-template-columns: 90px 1fr auto; gap: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--border-subtle); font-size: 13px; }
.form-dots { display: flex; gap: 6px; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: var(--color-loss); }
.dot.win { background: var(--color-win); }
.muted { color: var(--text-tertiary); font-size: 14px; }
@media (max-width: 640px) { .header { flex-wrap: wrap; gap: 8px 12px; } .team-block { font-size: 22px; } .card { padding: 18px; } .match-list li { grid-template-columns: 1fr; gap: 4px; } }
</style>
