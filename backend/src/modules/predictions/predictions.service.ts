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

export interface UserVoteBreakdown {
  totalVotes: number;
  teamAVotes: number;
  teamBVotes: number;
  teamAPercent: number | null;
  teamBPercent: number | null;
}

/** Winrate d'une équipe sur l'année civile en cours (tous les matchs terminés). */
async function getSeasonHeadToHead(
  teamA: string,
  teamB: string,
  excludeObjectname?: string
) {
  const currentYear = new Date().getFullYear();

  const conditions = [
    `match2opponents::text ILIKE $1`,
    `match2opponents::text ILIKE $2`,
    `pagename LIKE $3`,
    `game ILIKE 'leagueoflegends'`,
  ];

  const params: unknown[] = [
    `%${teamA}%`,
    `%${teamB}%`,
    `%/${currentYear}/%`,
  ];

  if (excludeObjectname) {
    conditions.push(`objectname != $4`);
    params.push(excludeObjectname);
  }

  const rows = await prisma.$queryRawUnsafe<{ objectname: string }[]>(
    `SELECT objectname
     FROM matches
     WHERE ${conditions.join(" AND ")}
     ORDER BY date DESC
     LIMIT 200`,
    ...params
  );

  const matches = await prisma.match.findMany({
    where: {
      objectname: {
        in: rows.map((r) => r.objectname),
      },
    },
  });

  let winsA = 0;
  let winsB = 0;
  let total = 0;

  for (const m of matches) {
    const opponents = Array.isArray(m.match2opponents)
      ? m.match2opponents
      : JSON.parse(m.match2opponents as string);

    const a = opponents.find((op: any) => op.name === teamA);
    const b = opponents.find((op: any) => op.name === teamB);

    // Le match ne concerne pas exactement ces deux équipes
    if (!a || !b) continue;

    const scoreA = Number(a.score);
    const scoreB = Number(b.score);

    // Match pas encore joué
    if (
      Number.isNaN(scoreA) ||
      Number.isNaN(scoreB) ||
      scoreA < 0 ||
      scoreB < 0
    ) {
      continue;
    }

    total++;

    if (scoreA > scoreB) {
      winsA++;
    } else if (scoreB > scoreA) {
      winsB++;
    }
  }

  return {
    winsA,
    winsB,
    total,
    winrateA: total > 0 ? winsA / total : 0.5,
    winrateB: total > 0 ? winsB / total : 0.5,
  };
}

/**
 * Système d'analyse statistique. Combine quatre signaux, pondérés et
 * expliqués : forme récente (10 derniers matchs), confrontations directes,
 * winrate de la saison en cours, et dynamique (série en cours).
 * La saison en cours sert surtout de filet de sécurité quand une équipe
 * a trop peu de matchs récents pour que la forme seule soit fiable.
 */
export async function predictMatch(objectname: string): Promise<PredictionResult | null> {
  const match = await prisma.match.findFirst({
    where: {
      objectname,
      game: { equals: "leagueoflegends", mode: "insensitive" },
    },
  });
  if (!match) return null;

  const [teamA, teamB] = extractTeamNames(match.match2opponents);
  if (!teamA || !teamB) return null;

  const [formA, formB, h2h, seasonH2H] = await Promise.all([
    getRecentForm(teamA, objectname, 10),
    getRecentForm(teamB, objectname, 10),
    getHeadToHead(teamA, teamB, objectname, 10),
    getSeasonHeadToHead(teamA, teamB, objectname),
  ]);

  const seasonA = {
    wins: seasonH2H.winsA,
    total: seasonH2H.total,
    winrate: seasonH2H.winrateA,
  };
  const seasonB = {
    wins: seasonH2H.winsB,
    total: seasonH2H.total,
    winrate: seasonH2H.winrateB,
  };

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

  const h2hWinsA = h2h.filter((m) =>
    (m.teams as string[])[0] === teamA
      ? m.winner === "1"
      : m.winner === "2"
  ).length;

  const h2hTotal = h2h.length;
  const h2hRateA = h2hTotal ? h2hWinsA / h2hTotal : 0.5;

  const streakA = currentStreak(formA);
  const streakB = currentStreak(formB);

  const streakScoreA = Math.max(-1, Math.min(1, streakA / 5));
  const streakScoreB = Math.max(-1, Math.min(1, streakB / 5));

  // La saison en cours est la donnée principale
  const scoreA =
    seasonA.winrate * 0.60 +
    wrA * 0.20 +
    h2hRateA * 0.10 +
    ((streakScoreA + 1) / 2) * 0.10;

  const scoreB =
    seasonB.winrate * 0.60 +
    wrB * 0.20 +
    (1 - h2hRateA) * 0.10 +
    ((streakScoreB + 1) / 2) * 0.10;

  const total = scoreA + scoreB || 1;

  const confidenceA = Math.round((scoreA / total) * 100);
  const confidenceB = 100 - confidenceA;

  const favoredTeam = confidenceA >= 50 ? teamA : teamB;
  const confidence = confidenceA >= 50 ? confidenceA : 100 - confidenceA;

  const reasons: Record<string, PredictionReason[]> = {
    [teamA]: buildReasons(formA, wrA, streakA, h2hRateA, h2hTotal, seasonA),
    [teamB]: buildReasons(formB, wrB, streakB, 1 - h2hRateA, h2hTotal, seasonB),
  };

  return { favoredTeam, confidence, reasons };
}

function buildReasons(
  form: Awaited<ReturnType<typeof getRecentForm>>,
  winrate: number,
  streak: number,
  h2hRate: number,
  h2hTotal: number,
  season: { wins: number; total: number; winrate: number }
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

  if (season.total > 0) {
    reasons.push({
      type: season.winrate >= 0.5 ? "positive" : "negative",
      label: `${season.wins} victoires sur ${season.total} matchs cette saison (${Math.round(season.winrate * 100)}%)`,
    });
  }

  if (winrate < 0.4) {
    reasons.push({ type: "negative", label: "Difficulté récente à retrouver la victoire" });
  }

  return reasons;
}

/** Répartition des pronostics des utilisateurs du site pour un match donné. */
export async function getUserVoteBreakdown(objectname: string): Promise<UserVoteBreakdown | null> {
  const match = await prisma.match.findFirst({
    where: {
      objectname,
      game: { equals: "leagueoflegends", mode: "insensitive" },
    },
  });
  if (!match) return null;

  const votes = await prisma.webPrediction.findMany({ where: { matchObjectId: objectname } });
  const teamAVotes = votes.filter((v) => v.predictedWinner === 1).length;
  const teamBVotes = votes.filter((v) => v.predictedWinner === 2).length;
  const totalVotes = teamAVotes + teamBVotes;

  return {
    totalVotes,
    teamAVotes,
    teamBVotes,
    teamAPercent: totalVotes > 0 ? Math.round((teamAVotes / totalVotes) * 100) : null,
    teamBPercent: totalVotes > 0 ? Math.round((teamBVotes / totalVotes) * 100) : null,
  };
}