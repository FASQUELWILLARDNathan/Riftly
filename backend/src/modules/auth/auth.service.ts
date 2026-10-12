import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { randomBytes } from "crypto";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";

export async function register(email: string, username: string, password: string) {
  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existing) {
    throw Object.assign(new Error("Email ou nom d'utilisateur déjà utilisé"), { statusCode: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, username, passwordHash },
    select: { id: true, email: true, username: true, createdAt: true },
  });

  return { user, token: await createSessionToken(user.id) };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw Object.assign(new Error("Identifiants invalides"), { statusCode: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error("Identifiants invalides"), { statusCode: 401 });
  }

  return {
    user: { id: user.id, email: user.email, username: user.username, createdAt: user.createdAt },
    token: await createSessionToken(user.id),
  };
}

export function getSessionId(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
    return typeof payload === "object" && payload !== null && typeof payload.sid === "string" ? payload.sid : null;
  } catch {
    return null;
  }
}

async function createSessionToken(userId: string) {
  const sid = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + env.jwtCookieMaxAge);
  await prisma.session.create({ data: { sid, userId, expiresAt } });
  return jwt.sign({ sub: userId, sid }, env.jwtSecret, {
    algorithm: "HS256",
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  });
}

export async function revokeSession(sid: string) {
  await prisma.session.updateMany({ where: { sid, revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function revokeUserSessions(userId: string) {
  await prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function purgeExpiredSessions() {
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
