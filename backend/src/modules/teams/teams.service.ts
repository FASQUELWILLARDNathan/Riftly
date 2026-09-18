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

  const objectnames = await findObjectnamesInvolvingTeam(team.name, { finishedOnly: false });
  const matches = objectnames.length
    ? await prisma.match.findMany({
        where: { objectname: { in: objectnames } },
        orderBy: { date: "desc" },
        take: 50,
      })
    : [];

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
    ...mapTeamAssetUrls(team),
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