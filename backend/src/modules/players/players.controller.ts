import { Request, Response, NextFunction } from "express";
import * as playersService from "./players.service";

export async function getPlayers(req: Request, res: Response, next: NextFunction) {
  try {
    const players = await playersService.searchPlayers(req.query.q as string | undefined);
    res.json({ data: players });
  } catch (err) {
    next(err);
  }
}

export async function getPlayerById(req: Request, res: Response, next: NextFunction) {
  try {
    let pageid: bigint;
    try {
      pageid = BigInt(req.params.id);
    } catch {
      return res.status(400).json({ error: "id invalide" });
    }
    const player = await playersService.getPlayerDetail(pageid);
    if (!player) {
      return res.status(404).json({ error: "Joueur introuvable" });
    }
    res.json({ data: player });
  } catch (err) {
    next(err);
  }
}
