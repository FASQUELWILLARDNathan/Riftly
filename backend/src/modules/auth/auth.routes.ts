import { Router } from "express";
import * as authController from "./auth.controller";
import { issueCsrfToken } from "../../middlewares/csrf";
import rateLimit from "express-rate-limit";

const router = Router();

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: "Trop de tentatives. Réessayez dans quelques minutes." },
});

const registerLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: "Trop de créations de compte. Réessayez dans quelques minutes." },
});

router.get("/csrf", issueCsrfToken);
router.post("/register", registerLimiter, authController.postRegister);
router.post("/login", loginLimiter, authController.postLogin);
router.post("/logout", authController.postLogout);

export default router;
