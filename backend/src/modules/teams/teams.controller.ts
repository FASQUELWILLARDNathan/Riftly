import { Request, Response, NextFunction } from "express";
import * as teamsService from "./teams.service";

export async function getTeams(req: Request, res: Response, next: NextFunction) {
  try {
    const teams = await teamsService.searchTeams(req.query.q as string | undefined);
    res.json({ data: teams });
  } catch (err) {
    next(err);
  }
}

export async function getTeamById(req: Request, res: Response, next: NextFunction) {
  try {
    const pageid = Number(req.params.id);
    if (Number.isNaN(pageid)) {
      return res.status(400).json({ error: "id invalide" });
    }
    const team = await teamsService.getTeamDetail(pageid);
    if (!team) {
      return res.status(404).json({ error: "Équipe introuvable" });
    }
    res.json({ data: team });
  } catch (err) {
    next(err);
  }
}
