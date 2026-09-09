import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true, createdAt: true },
  });
  if (!user) return null;

  const [favorites, predictions] = await Promise.all([
    prisma.favorite.findMany({ where: { userId }, include: { team: true } }),
    prisma.webPrediction.findMany({ where: { userId }, include: { match: true } }),
  ]);

  const settled = predictions.filter((p) => p.match.winner && p.match.winner !== "");
  const correct = settled.filter((p) => p.predictedWinner === Number(p.match.winner)).length;

  return {
    ...user,
    favoriteTeams: favorites.map((f) => ({
      pageid: f.team.pageid,
      name: f.team.name,
      logourl: f.team.logourl,
    })),
    predictionStats: {
      total: predictions.length,
      settled: settled.length,
      correct,
      successRate: settled.length > 0 ? Math.round((correct / settled.length) * 1000) / 10 : null,
    },
  };
}

export async function addFavorite(userId: string, teamId: number) {
  return prisma.favorite.upsert({
    where: { userId_teamId: { userId, teamId } },
    create: { userId, teamId },
    update: {},
  });
}

export async function removeFavorite(userId: string, teamId: number) {
  await prisma.favorite.deleteMany({ where: { userId, teamId } });
}

export async function updateProfile(userId: string, data: { username?: string; email?: string }) {
  if (data.email || data.username) {
    const conflict = await prisma.user.findFirst({
      where: {
        id: { not: userId },
        OR: [
          ...(data.email ? [{ email: data.email }] : []),
          ...(data.username ? [{ username: data.username }] : []),
        ],
      },
    });
    if (conflict) {
      throw Object.assign(new Error("Email ou nom d'utilisateur déjà utilisé"), { statusCode: 409 });
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, username: true, createdAt: true },
  });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw Object.assign(new Error("Utilisateur introuvable"), { statusCode: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error("Mot de passe actuel incorrect"), { statusCode: 401 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
