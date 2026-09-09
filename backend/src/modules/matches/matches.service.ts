import { prisma } from "../../lib/prisma";
import { extractTeamNames, getRegionFromSeries } from "../../lib/region";

export type MatchStatusFilter = "live" | "upcoming" | "finished";

function toSummary(match: Awaited<ReturnType<typeof prisma.match.findFirstOrThrow>>) {
  const teamNames = extractTeamNames(match.match2opponents);
  return {
    id: match.objectname,
    date: match.date,
    tournament: match.tournament,
    region: getRegionFromSeries(match.series, match.tournament),
    status: match.status,
    finished: match.finished,
    winner: match.winner,
    bestOf: match.bestof,
    teams: teamNames,
    opponents: match.match2opponents,
  };
}

/** Liste des matchs par statut, avec filtre optionnel équipe/région. */
export async function listMatches(params: {
  statusFilter: MatchStatusFilter;
  team?: string;
  region?: string;
  take?: number;
}) {
  const { statusFilter, team, region, take = 50 } = params;
  const now = new Date();

  const where: any = {};

  if (statusFilter === "finished") {
    where.finished = true;
  } else if (statusFilter === "upcoming") {
    where.finished = false;
    where.date = { gte: now };
  } else if (statusFilter === "live") {
    // "live" = pas fini, et date de début déjà passée (proxy simple ;
    // à affiner plus tard avec un vrai statut "ongoing" si l'API Liquipedia
    // l'expose de façon fiable)
    where.finished = false;
    where.date = { lte: now };
  }

  if (team) {
    where.match2opponents = { path: [], string_contains: team } as any;
  }

  const matches = await prisma.match.findMany({
    where,
    orderBy: { date: statusFilter === "finished" ? "desc" : "asc" },
    take,
  });

  const filtered = region
    ? matches.filter((m) => getRegionFromSeries(m.series, m.tournament).toUpperCase() === region.toUpperCase())
    : matches;

  return filtered.map(toSummary);
}

/** Détail complet d'un match : infos + head-to-head + forme récente des deux équipes. */
export async function getMatchDetail(objectname: string) {
  const match = await prisma.match.findUnique({ where: { objectname } });
  if (!match) return null;

  const teamNames = extractTeamNames(match.match2opponents);
  const [teamA, teamB] = teamNames;

  const headToHead = teamA && teamB ? await getHeadToHead(teamA, teamB, match.objectname) : [];
  const recentFormA = teamA ? await getRecentForm(teamA, match.objectname) : [];
  const recentFormB = teamB ? await getRecentForm(teamB, match.objectname) : [];

  return {
    ...toSummary(match),
    headToHead,
    recentForm: {
      [teamA ?? "teamA"]: recentFormA,
      [teamB ?? "teamB"]: recentFormB,
    },
  };
}

/** Historique des confrontations directes entre deux équipes (matchs terminés, hors match courant). */
async function getHeadToHead(teamA: string, teamB: string, excludeObjectname: string, limit = 10) {
  // Filtre grossier en SQL (contient les deux noms), affiné en mémoire
  // car le JSON peut contenir des variantes de nom (ex: "KC" vs "Karmine Corp").
  const candidates = await prisma.match.findMany({
    where: {
      finished: true,
      objectname: { not: excludeObjectname },
      AND: [
        { match2opponents: { string_contains: teamA } as any },
        { match2opponents: { string_contains: teamB } as any },
      ],
    },
    orderBy: { date: "desc" },
    take: limit * 3, // marge, on filtre ensuite précisément
  });

  return candidates
    .filter((m) => {
      const names = extractTeamNames(m.match2opponents);
      return names.includes(teamA) && names.includes(teamB);
    })
    .slice(0, limit)
    .map(toSummary);
}

/** Forme récente d'une équipe : N derniers matchs terminés, victoires/défaites. */
async function getRecentForm(teamName: string, excludeObjectname: string, limit = 10) {
  const candidates = await prisma.match.findMany({
    where: {
      finished: true,
      objectname: { not: excludeObjectname },
      match2opponents: { string_contains: teamName } as any,
    },
    orderBy: { date: "desc" },
    take: limit * 2,
  });

  return candidates
    .filter((m) => extractTeamNames(m.match2opponents).includes(teamName))
    .slice(0, limit)
    .map((m) => {
      const names = extractTeamNames(m.match2opponents);
      const teamIndex = names.indexOf(teamName); // 0-based
      const won = m.winner === String(teamIndex + 1); // winner stocké en 1-based
      return {
        matchId: m.objectname,
        date: m.date,
        tournament: m.tournament,
        opponent: names.find((n) => n !== teamName) ?? "Inconnu",
        result: won ? "win" : "loss",
      };
    });
}

export { getRecentForm, getHeadToHead };
