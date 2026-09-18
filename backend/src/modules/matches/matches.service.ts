import { prisma } from "../../lib/prisma";
import { publicAssetUrl } from "../../lib/assets";
import { extractTeamNames, getRegionFromSeries } from "../../lib/region";

export type MatchStatusFilter = "live" | "upcoming" | "finished";

/** Trouve les objectnames des matchs impliquant une équipe, via ILIKE en SQL brut.
 * Nécessaire car le filtre Prisma `string_contains` ne fonctionne pas correctement
 * sur une colonne JSON qui contient un tableau (match2opponents), contrairement à
 * une chaîne simple — il faut caster en texte côté SQL comme le faisait le bot Python. */
async function findObjectnamesInvolvingTeam(
  teamName: string,
  opts: { finishedOnly?: boolean; excludeObjectname?: string } = {}
): Promise<string[]> {

  const currentYear = new Date().getFullYear();

  const conditions: string[] = [
    `match2opponents::text ILIKE $1`,
    `pagename LIKE '%/${currentYear}/%'`
  ];

  const params: unknown[] = [`%${teamName}%`];
  let idx = 2;

  if (opts.finishedOnly) conditions.push(`finished = true`);

  if (opts.excludeObjectname) {
    conditions.push(`objectname != $${idx}`);
    params.push(opts.excludeObjectname);
    idx++;
  }

  const rows = await prisma.$queryRawUnsafe<{ objectname: string }[]>(
    `SELECT objectname
     FROM matches
     WHERE ${conditions.join(" AND ")}
     ORDER BY date DESC
     LIMIT 200`,
    ...params
  );

  console.log("DEBUG SQL BRUT", {
    teamName,
    paramsUsed: params,
    rowsFound: rows.length
  });

  return rows.map((r) => r.objectname);
}

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

/** Récupère en une seule requête les logos de toutes les équipes présentes dans une liste de matchs. */
async function attachTeamLogos<T extends { teams: string[] }>(items: T[]) {
  const allNames = Array.from(new Set(items.flatMap((i) => i.teams)));
  if (!allNames.length) return items.map((i) => ({ ...i, teamLogos: [] }));

  const teams = await prisma.team.findMany({
    where: { name: { in: allNames } },
    select: {
      name: true,
      logourl: true,
      logodarkurl: true,
      textlesslogourl: true,
      textlesslogodarkurl: true,
    },
  });
  const byName = new Map(teams.map((t) => [t.name, t]));

  return items.map((i) => ({
    ...i,
    teamLogos: i.teams.map((name) => ({
      name,
      logourl: publicAssetUrl(byName.get(name)?.logourl ?? null),
      logodarkurl: publicAssetUrl(byName.get(name)?.logodarkurl ?? null),
      textlesslogourl: publicAssetUrl(byName.get(name)?.textlesslogourl ?? null),
      textlesslogodarkurl: publicAssetUrl(byName.get(name)?.textlesslogodarkurl ?? null),
    })),
  }));
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

  const summaries = filtered.map(toSummary);
  return attachTeamLogos(summaries);
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
  const objectnamesA = await findObjectnamesInvolvingTeam(teamA, { finishedOnly: true, excludeObjectname });
  if (!objectnamesA.length) return [];

  const candidates = await prisma.match.findMany({
    where: { objectname: { in: objectnamesA } },
    orderBy: { date: "desc" },
  });

  return candidates
    .filter((m) => {
      const names = extractTeamNames(m.match2opponents);
      return names.includes(teamA) && names.includes(teamB);
    })
    .slice(0, limit)
    .map(toSummary);
}

async function getRecentForm(
  teamName: string,
  excludeObjectname: string,
  limit = 10
) {
  const objectnames = await findObjectnamesInvolvingTeam(teamName, {
    finishedOnly: true,
    excludeObjectname,
  });

  if (!objectnames.length) return [];

  const candidates = await prisma.match.findMany({
    where: { objectname: { in: objectnames } },
    orderBy: { date: "desc" },
    take: limit,
  });

  return candidates
    .map((m) => {
      const opponents = Array.isArray(m.match2opponents)
        ? m.match2opponents
        : JSON.parse(m.match2opponents as string);

      const team = opponents.find(
        (op: any) => op.name === teamName
      );

      if (!team) return null;

      const opponent = opponents.find(
        (op: any) => op.name !== teamName
      );

      const won =
        Number(team.score) > Number(opponent?.score ?? -1);

      return {
        matchId: m.objectname,
        date: m.date,
        tournament: m.tournament,
        opponent: opponent?.name ?? "Inconnu",
        result: won ? "win" : "loss",
      };
    })
    .filter(
      (m): m is NonNullable<typeof m> => m !== null
    );
}

export { getRecentForm, getHeadToHead, attachTeamLogos, findObjectnamesInvolvingTeam };
