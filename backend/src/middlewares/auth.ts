import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  sessionId?: string;
}

function getCookie(req: Request, name: string): string | undefined {
  return req.headers.cookie?.split(";").map((part) => part.trim()).map((part) => {
    const separator = part.indexOf("=");
    return separator < 0 ? null : [part.slice(0, separator), part.slice(separator + 1)] as const;
  }).find((entry) => entry?.[0] === name)?.[1];
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const cookieToken = getCookie(req, env.sessionCookieName);
  const token = cookieToken ? decodeURIComponent(cookieToken) : undefined;
  if (!token) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
    if (
      typeof payload !== "object" || payload === null ||
      typeof payload.sub !== "string" || !payload.sub ||
      typeof payload.sid !== "string" || !/^[a-f0-9]{64}$/.test(payload.sid) ||
      typeof payload.exp !== "number"
    ) {
      return res.status(401).json({ error: "Token invalide ou expiré" });
    }
    const session = await prisma.session.findUnique({ where: { sid: payload.sid } });
    if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt <= new Date()) {
      return res.status(401).json({ error: "Token invalide ou expiré" });
    }
    req.userId = payload.sub;
    req.sessionId = payload.sid;
    next();
  } catch {
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
}
