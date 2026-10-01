import { Request, Response, NextFunction } from "express";
import * as matchesService from "./matches.service";

export async function getMatches(req: Request, res: Response, next: NextFunction) {
  try {
    const status = (req.query.status as string) ?? "upcoming";
    if (!["live", "upcoming", "finished"].includes(status)) {
      return res.status(400).json({ error: "status doit être 'live', 'upcoming' ou 'finished'" });
    }

    const limit = req.query.limit === undefined ? undefined : Number(req.query.limit);
    if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 100)) {
      return res.status(400).json({ error: "limit doit être un entier entre 1 et 100" });
    }

    const matches = await matchesService.listMatches({
      statusFilter: status as matchesService.MatchStatusFilter,
      team: req.query.team as string | undefined,
      region: req.query.region as string | undefined,
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
