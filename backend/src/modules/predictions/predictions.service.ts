import { prisma } from "../../lib/prisma";
import { extractTeamNames } from "../../lib/region";
import { getHeadToHead, getRecentForm } from "../matches/matches.service";

export interface PredictionReason {
  type: "positive" | "negative";
  label: string;
}

export interface PredictionResult {
  favoredTeam: string;
  confidence: number; // 0-100, probabilité estimée de victoire de favoredTeam
  reasons: Record<string, PredictionReason[]>; // par équipe
}

/**
 * Système d'analyse statistique — version généralisée de la logique
 * historiquement codée en dur autour de "Karmine Corp" dans le bot.
 * Pas de ML ici volontairement (cf. brief) : des règles pondérées,
 * lisibles et explicables, sur des données déjà en base.
 */
export async function predictMatch(objectname: string): Promise<PredictionResult | null> {
  const match = await prisma.match.findUnique({ where: { objectname } });
  if (!match) return null;

  const [teamA, teamB] = extractTeamNames(match.match2opponents);
  if (!teamA || !teamB) return null;

  const [formA, formB, h2h] = await Promise.all([
    getRecentForm(teamA, objectname, 10),
    getRecentForm(teamB, objectname, 10),
    getHeadToHead(teamA, teamB, objectname, 10),
  ]);

  const winrate = (form: Awaited<ReturnType<typeof getRecentForm>>) =>
    form.length ? form.filter((m) => m.result === "win").length / form.length : 0.5;

  const currentStreak = (form: Awaited<ReturnType<typeof getRecentForm>>) => {
    if (!form.length) return 0;
    const first = form[0].result;
    let streak = 0;
    for (const m of form) {
      if (m.result !== first) break;
      streak += 1;
    }
    return first === "win" ? streak : -streak;
  };

  const wrA = winrate(formA);
  const wrB = winrate(formB);

  const h2hWinsA = h2h.filter((m) => (m.teams as string[])[0] === teamA ? m.winner === "1" : m.winner === "2").length;
  const h2hTotal = h2h.length;
  const h2hRateA = h2hTotal ? h2hWinsA / h2hTotal : 0.5;

  const streakA = currentStreak(formA);
  const streakB = currentStreak(formB);

  // Pondération simple et transparente : 50% forme récente, 30% head-to-head, 20% dynamique (streak)
  const streakScoreA = Math.max(-1, Math.min(1, streakA / 5));
  const streakScoreB = Math.max(-1, Math.min(1, streakB / 5));

  const scoreA = wrA * 0.5 + h2hRateA * 0.3 + ((streakScoreA + 1) / 2) * 0.2;
  const scoreB = (1 - wrA) * 0.5 + (1 - h2hRateA) * 0.3 + ((streakScoreB + 1) / 2) * 0.2;

  const total = scoreA + scoreB || 1;
  const confidenceA = Math.round((scoreA / total) * 100);

  const favoredTeam = confidenceA >= 50 ? teamA : teamB;
  const confidence = confidenceA >= 50 ? confidenceA : 100 - confidenceA;

  const reasons: Record<string, PredictionReason[]> = {
    [teamA]: buildReasons(formA, wrA, streakA, h2hRateA, h2hTotal),
    [teamB]: buildReasons(formB, wrB, streakB, 1 - h2hRateA, h2hTotal),
  };

  return { favoredTeam, confidence, reasons };
}

function buildReasons(
  form: Awaited<ReturnType<typeof getRecentForm>>,
  winrate: number,
  streak: number,
  h2hRate: number,
  h2hTotal: number
): PredictionReason[] {
  const reasons: PredictionReason[] = [];
  const wins = form.filter((m) => m.result === "win").length;

  if (form.length > 0) {
    reasons.push({
      type: wins >= form.length / 2 ? "positive" : "negative",
      label: `${wins} victoires sur les ${form.length} derniers matchs`,
    });
  }

  if (streak >= 3) {
    reasons.push({ type: "positive", label: `Série de ${streak} victoires consécutives` });
  } else if (streak <= -3) {
    reasons.push({ type: "negative", label: `Série de ${-streak} défaites consécutives` });
  }

  if (h2hTotal > 0) {
    reasons.push({
      type: h2hRate >= 0.5 ? "positive" : "negative",
      label: `${Math.round(h2hRate * 100)}% de victoires dans les confrontations directes (${h2hTotal} matchs)`,
    });
  }

  if (winrate < 0.4) {
    reasons.push({ type: "negative", label: "Difficulté récente à retrouver la victoire" });
  }

  return reasons;
}
