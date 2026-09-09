import { Router } from "express";
import { requireAuth } from "../../middlewares/auth";
import * as usersController from "./users.controller";

const router = Router();

router.use(requireAuth);

router.get("/me", usersController.getMe);
router.patch("/me", usersController.patchMe);
router.post("/me/password", usersController.postPassword);
router.post("/me/favorites", usersController.postFavorite);
router.delete("/me/favorites/:teamId", usersController.deleteFavorite);

export default router;
