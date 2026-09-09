import { prisma } from "../../lib/prisma";
import { publicAssetUrl } from "../../lib/assets";
import { extractTeamNames } from "../../lib/region";

export async function searchTeams(query?: string, take = 20) {
  const teams = await prisma.team.findMany({
    where: query ? { name: { contains: query, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    take,
    select: {
      pageid: true,
      name: true,
      region: true,
      logourl: true,
      textlesslogourl: true,
      status: true,
    },
  });

  return teams.map((team) => ({
    ...team,
    logourl: publicAssetUrl(team.logourl),
    textlesslogourl: publicAssetUrl(team.textlesslogourl),
  }));
}

export async function getTeamDetail(pageid: number) {
  const team = await prisma.team.findUnique({
    where: { pageid },
    include: { players: true },
  });
  if (!team) return null;

  const matches = await prisma.match.findMany({
    where: { match2opponents: { string_contains: team.name } as any },
    orderBy: { date: "desc" },
    take: 50,
  });

  const relevant = matches.filter((m) => extractTeamNames(m.match2opponents).includes(team.name));
  const finished = relevant.filter((m) => m.finished);

  let wins = 0;
  let losses = 0;
  for (const m of finished) {
    const names = extractTeamNames(m.match2opponents);
    const idx = names.indexOf(team.name);
    if (m.winner === String(idx + 1)) wins += 1;
    else losses += 1;
  }
  const winrate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 1000) / 10 : null;

  return {
    ...team,
    logourl: publicAssetUrl(team.logourl),
    textlesslogourl: publicAssetUrl(team.textlesslogourl),
    stats: {
      wins,
      losses,
      winrate,
      matchesPlayed: wins + losses,
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
