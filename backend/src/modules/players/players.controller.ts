import { Request, Response, NextFunction } from "express";
import * as playersService from "./players.service";
import { z } from "zod";

const searchSchema = z.object({ q: z.string().trim().max(100).optional() }).strict();

export async function getPlayers(req: Request, res: Response, next: NextFunction) {
  try {
    const { q } = searchSchema.parse(req.query);
    const players = await playersService.searchPlayers(q);
    res.json({ data: players });
  } catch (err) {
    next(err);
  }
}

export async function getPlayerById(req: Request, res: Response, next: NextFunction) {
  try {
    const pageid = z.coerce.bigint().positive().parse(req.params.id);
    const player = await playersService.getPlayerDetail(pageid);
    if (!player) {
      return res.status(404).json({ error: "Joueur introuvable" });
    }
    res.json({ data: player });
  } catch (err) {
    next(err);
  }
}
