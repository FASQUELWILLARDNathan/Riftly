<script setup lang="ts">
import { computed } from "vue";
import type { MatchSummary } from "@/api/client";

const props = defineProps<{ match: MatchSummary }>();

const teamA = computed(() => props.match.teams[0] ?? "TBD");
const teamB = computed(() => props.match.teams[1] ?? "TBD");

const winnerIndex = computed(() => (props.match.winner ? Number(props.match.winner) : null));

const formattedDate = computed(() => {
  if (!props.match.date) return "Date à confirmer";
  const d = new Date(props.match.date);
  return d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
});
</script>

<template>
  <NuxtLink :to="`/matchs/${match.id}`" class="card">
    <div class="card-top">
      <span class="region font-mono">{{ match.region }}</span>
      <span class="date font-mono">{{ formattedDate }}</span>
    </div>

    <div class="matchup">
      <div class="team" :class="{ winner: winnerIndex === 1 }">
        <span class="team-name">{{ teamA }}</span>
      </div>
      <span class="vs font-display">VS</span>
      <div class="team" :class="{ winner: winnerIndex === 2 }">
        <span class="team-name">{{ teamB }}</span>
      </div>
    </div>

    <div class="card-bottom">
      <span class="tournament">{{ match.tournament ?? "Tournoi non renseigné" }}</span>
      <span class="status" :class="match.finished ? 'status-finished' : 'status-upcoming'">
        {{ match.finished ? "Terminé" : "À venir" }}
      </span>
    </div>
  </NuxtLink>
</template>

<style scoped>
.card {
  display: block;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 16px 18px;
  box-shadow: var(--shadow-card);
  transition: border-color var(--transition-fast), transform var(--transition-fast);
  position: relative;
  overflow: hidden;
}
.card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(180deg, var(--color-gold), var(--accent));
  opacity: 0.8;
}
.card:hover {
  border-color: var(--border-strong);
  transform: translateY(-2px);
}

.card-top {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 12px;
}
.region {
  color: var(--color-gold);
  letter-spacing: 0.05em;
}

.matchup {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
}
.team {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 18px;
  color: var(--text-secondary);
}
.team.winner {
  color: var(--text-primary);
}
.team:last-child {
  text-align: right;
}
.vs {
  color: var(--text-tertiary);
  font-size: 13px;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
  font-size: 12px;
}
.tournament {
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 70%;
}
.status {
  font-family: var(--font-mono);
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
}
.status-finished {
  background: rgba(46, 204, 154, 0.12);
  color: var(--color-win);
}
.status-upcoming {
  background: rgba(10, 200, 185, 0.12);
  color: var(--accent);
}
</style>
