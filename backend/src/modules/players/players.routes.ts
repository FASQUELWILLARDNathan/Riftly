import { Router } from "express";
import * as playersController from "./players.controller";

const router = Router();

// GET /api/players?q=caps
router.get("/", playersController.getPlayers);

// GET /api/players/:id  (id = pageid)
router.get("/:id", playersController.getPlayerById);

export default router;
