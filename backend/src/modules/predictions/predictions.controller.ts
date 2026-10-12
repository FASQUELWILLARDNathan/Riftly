import { Response, NextFunction, Request } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import * as predictionsService from "./predictions.service";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

const matchIdSchema = z.string().trim().min(1).max(255);
const voteSchema = z.object({
  matchId: matchIdSchema,
  predictedWinner: z.coerce.number().int().refine((value) => value === 1 || value === 2),
}).strict();

export async function getPrediction(req: Request, res: Response, next: NextFunction) {
  try {
    const [result, userVotes] = await Promise.all([
      predictionsService.predictMatch(matchIdSchema.parse(req.params.matchId)),
      predictionsService.getUserVoteBreakdown(matchIdSchema.parse(req.params.matchId)),
    ]);
    if (!result) return res.status(404).json({ error: "Impossible de générer une prédiction pour ce match" });
    res.json({ data: { ...result, userVotes } });
  } catch (err) {
    next(err);
  }
}

export async function getVote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const vote = await prisma.webPrediction.findUnique({
      where: { userId_matchObjectId: { userId: req.userId!, matchObjectId: matchIdSchema.parse(req.params.matchId) } },
      select: { predictedWinner: true },
    });
    res.json({ data: vote });
  } catch (err) {
    next(err);
  }
}

export async function postVote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { matchId, predictedWinner } = voteSchema.parse(req.body);

    const vote = await prisma.webPrediction.upsert({
      where: { userId_matchObjectId: { userId: req.userId!, matchObjectId: matchId } },
      create: { userId: req.userId!, matchObjectId: matchId, predictedWinner },
      update: { predictedWinner },
    });

    res.status(201).json({ data: vote });
  } catch (err) {
    next(err);
  }
}
