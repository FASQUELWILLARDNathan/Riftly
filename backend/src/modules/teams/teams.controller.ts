import { Request, Response, NextFunction } from "express";
import * as teamsService from "./teams.service";
import { z } from "zod";

const idSchema = z.coerce.number().int().positive().max(2147483647);
const searchSchema = z.object({ q: z.string().trim().max(100).optional() }).strict();

export async function getTeams(req: Request, res: Response, next: NextFunction) {
  try {
    const { q } = searchSchema.parse(req.query);
    const teams = await teamsService.searchTeams(q);
    res.json({ data: teams });
  } catch (err) {
    next(err);
  }
}

export async function getTeamById(req: Request, res: Response, next: NextFunction) {
  try {
    const pageid = idSchema.parse(req.params.id);
    const team = await teamsService.getTeamDetail(pageid);
    if (!team) {
      return res.status(404).json({ error: "Équipe introuvable" });
    }
    res.json({ data: team });
  } catch (err) {
    next(err);
  }
}
