import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../../middlewares/auth";
import * as usersService from "./users.service";
import { passwordSchema } from "../../lib/password";

const updateProfileSchema = z.object({
  username: z.string().min(3).max(32).optional(),
  email: z.string().email().optional(),
}).strict();

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
}).strict();

const positiveIntSchema = z.coerce.number().int().positive().max(2147483647);
const favoriteSchema = z.object({ teamId: positiveIntSchema }).strict();

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const profile = await usersService.getProfile(req.userId!);
    if (!profile) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
}

export async function postFavorite(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { teamId } = favoriteSchema.parse(req.body);
    await usersService.addFavorite(req.userId!, teamId);
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function deleteFavorite(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const teamId = positiveIntSchema.parse(req.params.teamId);
    await usersService.removeFavorite(req.userId!, teamId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function patchMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = updateProfileSchema.parse(req.body);
    const user = await usersService.updateProfile(req.userId!, body);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function postPassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const body = changePasswordSchema.parse(req.body);
    await usersService.changePassword(req.userId!, body.currentPassword, body.newPassword);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
