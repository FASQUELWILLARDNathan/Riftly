import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const cookieToken = req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("session="))
    ?.slice("session=".length);
  const token = cookieToken ? decodeURIComponent(cookieToken) : undefined;
  if (!token) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
}
