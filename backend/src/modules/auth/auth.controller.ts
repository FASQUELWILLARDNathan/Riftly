import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as authService from "./auth.service";

const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function postRegister(req: Request, res: Response, next: NextFunction) {
  try {
    const body = registerSchema.parse(req.body);
    const result = await authService.register(body.email, body.username, body.password);
    res.cookie("session", result.token, sessionCookieOptions);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function postLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body.email, body.password);
    res.cookie("session", result.token, sessionCookieOptions);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export function postLogout(_req: Request, res: Response) {
  res.clearCookie("session", sessionCookieOptions);
  res.status(204).send();
}
