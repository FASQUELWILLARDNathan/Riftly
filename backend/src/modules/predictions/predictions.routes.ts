import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import * as predictionsController from "./predictions.controller";

const router = Router();

// GET /api/predictions/:matchId  (public : l'analyse statistique du match)
router.get("/:matchId", predictionsController.getPrediction);

// GET /api/predictions/vote/:matchId (privé : vote de l'utilisateur connecté)
router.get("/vote/:matchId", requireAuth, predictionsController.getVote);

// POST /api/predictions/vote  (privé : l'utilisateur enregistre son pronostic)
router.post("/vote", requireAuth, predictionsController.postVote);

export default router;
