import { Request, Response, NextFunction } from "express";
import * as matchesService from "./matches.service";
import { z } from "zod";

const querySchema = z.object({
  status: z.enum(["live", "upcoming", "finished"]).default("upcoming"),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  team: z.string().trim().max(100).optional(),
  region: z.string().trim().max(100).optional(),
}).strict();

export async function getMatches(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, limit, team, region } = querySchema.parse(req.query);

    const matches = await matchesService.listMatches({
      statusFilter: status as matchesService.MatchStatusFilter,
      team,
      region,
      take: limit,
    });

    res.json({ data: matches });
  } catch (err) {
    next(err);
  }
}

export async function getMatchById(req: Request, res: Response, next: NextFunction) {
  try {
    const detail = await matchesService.getMatchDetail(req.params.id);
    if (!detail) {
      return res.status(404).json({ error: "Match introuvable" });
    }
    res.json({ data: detail });
  } catch (err) {
    next(err);
  }
}
