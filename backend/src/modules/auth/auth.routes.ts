import { Router } from "express";
import * as authController from "./auth.controller";

const router = Router();

router.post("/register", authController.postRegister);
router.post("/login", authController.postLogin);
router.post("/logout", authController.postLogout);

export default router;
