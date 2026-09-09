import { Router } from "express";
import * as teamsController from "./teams.controller";

const router = Router();

// GET /api/teams?q=karmine
router.get("/", teamsController.getTeams);

// GET /api/teams/:id  (id = pageid)
router.get("/:id", teamsController.getTeamById);

export default router;
