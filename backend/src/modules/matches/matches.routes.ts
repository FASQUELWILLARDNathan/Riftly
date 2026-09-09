import { Router } from "express";
import * as matchesController from "./matches.controller";

const router = Router();

// GET /api/matches?status=upcoming|live|finished&team=...&region=...&limit=50
router.get("/", matchesController.getMatches);

// GET /api/matches/:id  (id = objectname Liquipedia)
router.get("/:id", matchesController.getMatchById);

export default router;
