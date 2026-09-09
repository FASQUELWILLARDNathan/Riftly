import { Response, NextFunction, Request } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import * as predictionsService from "./predictions.service";
import { prisma } from "../../lib/prisma";

export async function getPrediction(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await predictionsService.predictMatch(req.params.matchId);
    if (!result) return res.status(404).json({ error: "Impossible de générer une prédiction pour ce match" });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getVote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const vote = await prisma.webPrediction.findUnique({
      where: { userId_matchObjectId: { userId: req.userId!, matchObjectId: req.params.matchId } },
      select: { predictedWinner: true },
    });
    res.json({ data: vote });
  } catch (err) {
    next(err);
  }
}

export async function postVote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { matchId, predictedWinner } = req.body as { matchId?: string; predictedWinner?: number };
    if (!matchId || ![1, 2].includes(Number(predictedWinner))) {
      return res.status(400).json({ error: "matchId et predictedWinner (1 ou 2) requis" });
    }

    const vote = await prisma.webPrediction.upsert({
      where: { userId_matchObjectId: { userId: req.userId!, matchObjectId: matchId } },
      create: { userId: req.userId!, matchObjectId: matchId, predictedWinner: Number(predictedWinner) },
      update: { predictedWinner: Number(predictedWinner) },
    });

    res.status(201).json({ data: vote });
  } catch (err) {
    next(err);
  }
}
