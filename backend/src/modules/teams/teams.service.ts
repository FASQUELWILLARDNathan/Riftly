import { prisma } from "../../lib/prisma";
import { publicAssetUrl } from "../../lib/assets";
import { extractTeamNames } from "../../lib/region";
import { findObjectnamesInvolvingTeam } from "../matches/matches.service";

function mapTeamAssetUrls<T extends {
  logourl: string | null;
  logodarkurl: string | null;
  textlesslogourl: string | null;
  textlesslogodarkurl: string | null;
}>(team: T) {
  return {
    ...team,
    logourl: publicAssetUrl(team.logourl),
    logodarkurl: publicAssetUrl(team.logodarkurl),
    textlesslogourl: publicAssetUrl(team.textlesslogourl),
    textlesslogodarkurl: publicAssetUrl(team.textlesslogodarkurl),
  };
}

function getMatchResult(
  match: { match2opponents: unknown; winner: string | null },
  teamName: string,
): "win" | "loss" | null {
  const opponents = Array.isArray(match.match2opponents)
    ? match.match2opponents
    : [];
  const names = extractTeamNames(opponents);
  const teamIndex = names.indexOf(teamName);

  if (teamIndex < 0) return null;

  const team = opponents[teamIndex] as { score?: unknown } | undefined;
  const opponent = opponents.find((_, index) => index !== teamIndex) as
    | { score?: unknown }
    | undefined;
  const teamScore = Number(team?.score);
  const opponentScore = Number(opponent?.score);

  if (Number.isFinite(teamScore) && Number.isFinite(opponentScore) && teamScore !== opponentScore) {
    return teamScore > opponentScore ? "win" : "loss";
  }

  if (match.winner === String(teamIndex + 1)) return "win";
  if (match.winner === "1" || match.winner === "2") return "loss";
  if (match.winner?.trim() === teamName) return "win";

  return null;
}

export async function searchTeams(query?: string, take = 100) {
  const teams = await prisma.team.findMany({
    where: query ? { name: { startsWith: query, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    take,
    select: {
      pageid: true,
      name: true,
      region: true,
      logourl: true,
      logodarkurl: true,
      textlesslogourl: true,
      textlesslogodarkurl: true,
      status: true,
    },
  });

  return teams.map(mapTeamAssetUrls);
}

export async function getTeamDetail(pageid: number) {
  const team = await prisma.team.findUnique({
    where: { pageid },
    include: { players: true },
  });

  if (!team) return null;

  const currentTeam = team;

  async function getStats(year?: number) {
    const objectnames = await findObjectnamesInvolvingTeam(currentTeam.name, {
      year,
    });

    if (!objectnames.length) {
      return {
        wins: 0,
        losses: 0,
        winrate: null,
        matchesPlayed: 0,
      };
    }

    const matches = await prisma.match.findMany({
      where: {
        objectname: { in: objectnames },
      },
    });

    const relevant = matches.filter((m) =>
      extractTeamNames(m.match2opponents).includes(currentTeam.name),
    );

    let wins = 0;
    let losses = 0;

    for (const m of relevant) {
      const result = getMatchResult(m, currentTeam.name);
      if (result === "win") wins += 1;
      if (result === "loss") losses += 1;
    }

    const matchesPlayed = wins + losses;

    return {
      wins,
      losses,
      winrate:
        matchesPlayed > 0
          ? Math.round((wins / matchesPlayed) * 1000) / 10
          : null,
      matchesPlayed,
    };
  }

  const currentYear = new Date().getFullYear();

  const [currentYearStats, globalStats] = await Promise.all([
    getStats(currentYear),
    getStats(),
  ]);

  // Matchs récents : on garde ton comportement actuel
  const objectnames = await findObjectnamesInvolvingTeam(team.name, {
    finishedOnly: false,
  });

  const matches = objectnames.length
    ? await prisma.match.findMany({
        where: { objectname: { in: objectnames } },
        orderBy: { date: "desc" },
        take: 50,
      })
    : [];

  const relevant = matches.filter((m) =>
    extractTeamNames(m.match2opponents).includes(team.name),
  );

  return {
    ...mapTeamAssetUrls(team),

    stats: {
      currentYear: currentYearStats,
      global: globalStats,
    },

    recentMatches: relevant.slice(0, 10).map((m) => ({
      id: m.objectname,
      date: m.date,
      tournament: m.tournament,
      finished: m.finished,
      winner: m.winner,
      teams: extractTeamNames(m.match2opponents),
    })),
  };
}