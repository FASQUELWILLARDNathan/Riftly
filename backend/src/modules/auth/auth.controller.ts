import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as authService from "./auth.service";
import { env } from "../../config/env";
import { passwordSchema } from "../../lib/password";

const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.secureCookies,
  maxAge: env.jwtCookieMaxAge,
  path: "/",
};

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  username: z.string().trim().min(3).max(32),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function postRegister(req: Request, res: Response, next: NextFunction) {
  try {
    const body = registerSchema.parse(req.body);
    const result = await authService.register(body.email, body.username, body.password);
    res.cookie(env.sessionCookieName, result.token, sessionCookieOptions);
    res.status(201).json({ data: { user: result.user } });
  } catch (err) {
    next(err);
  }
}

export async function postLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body.email, body.password);
    res.cookie(env.sessionCookieName, result.token, sessionCookieOptions);
    res.json({ data: { user: result.user } });
  } catch (err) {
    next(err);
  }
}

export async function postLogout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.cookie?.split(";").map((part) => part.trim())
      .find((part) => part.startsWith(`${env.sessionCookieName}=`))?.slice(env.sessionCookieName.length + 1);
    if (token) {
      const sid = authService.getSessionId(decodeURIComponent(token));
      if (sid) await authService.revokeSession(sid);
    }
    res.clearCookie(env.sessionCookieName, sessionCookieOptions);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
