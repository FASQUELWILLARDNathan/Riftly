import { randomBytes, timingSafeEqual } from "crypto";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

const csrfCookieOptions = {
  httpOnly: false,
  sameSite: "lax" as const,
  secure: env.secureCookies,
  maxAge: env.jwtCookieMaxAge,
  path: "/",
};

function getCookie(req: Request, name: string): string | undefined {
  return req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1)
    .replace(/^"|"$/g, "");
}

export function issueCsrfToken(_req: Request, res: Response) {
  const token = randomBytes(32).toString("hex");
  res.cookie(env.csrfCookieName, token, csrfCookieOptions);
  res.json({ data: { token } });
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (safeMethods.has(req.method)) return next();
  const origin = req.get("Origin");
  if (origin && origin !== env.corsOrigin) {
    return res.status(403).json({ error: "Origine non autorisée" });
  }

  const cookieToken = getCookie(req, env.csrfCookieName);
  const headerToken = req.get("X-CSRF-Token");
  if (!cookieToken || !headerToken || cookieToken.length !== headerToken.length) {
    return res.status(403).json({ error: "Protection CSRF requise" });
  }

  if (!/^[a-f0-9]{64}$/i.test(cookieToken) || !/^[a-f0-9]{64}$/i.test(headerToken)) {
    return res.status(403).json({ error: "Protection CSRF invalide" });
  }
  const tokensMatch = timingSafeEqual(Buffer.from(cookieToken, "utf8"), Buffer.from(headerToken, "utf8"));
  if (!tokensMatch) {
    return res.status(403).json({ error: "Protection CSRF invalide" });
  }

  next();
}