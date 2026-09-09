import { prisma } from "../../lib/prisma";
import { extractTeamNames } from "../../lib/region";

export async function searchPlayers(query?: string, take = 20) {
  return prisma.player.findMany({
    where: query
      ? {
          OR: [{ id: { contains: query, mode: "insensitive" } }, { name: { contains: query, mode: "insensitive" } }],
        }
      : undefined,
    orderBy: { id: "asc" },
    take,
    select: {
      pageid: true,
      id: true,
      name: true,
      nationality: true,
      teampagename: true,
      pageidteam: true,
    },
  });
}

export async function getPlayerDetail(pageid: bigint) {
  const player = await prisma.player.findUnique({
    where: { pageid },
    include: { team: true },
  });
  if (!player) return null;

  if (!player.team) return { ...player, recentMatches: [] };

  const matches = await prisma.match.findMany({
    where: { match2opponents: { string_contains: player.team.name } as any },
    orderBy: { date: "desc" },
    take: 10,
  });

  const relevant = matches.filter((m) => extractTeamNames(m.match2opponents).includes(player.team!.name));

  return {
    ...player,
    recentMatches: relevant.map((m) => ({
      id: m.objectname,
      date: m.date,
      tournament: m.tournament,
      finished: m.finished,
      teams: extractTeamNames(m.match2opponents),
    })),
  };
}
