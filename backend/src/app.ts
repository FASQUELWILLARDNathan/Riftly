import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { csrfProtection } from "./middlewares/csrf";
import { proxyAsset } from "./lib/assets";

import matchesRoutes from "./modules/matches/matches.routes";
import teamsRoutes from "./modules/teams/teams.routes";
import playersRoutes from "./modules/players/players.routes";
import predictionsRoutes from "./modules/predictions/predictions.routes";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";

export const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(cors({
  origin: (origin, callback) => callback(null, !origin || origin === env.corsOrigin ? origin ?? env.corsOrigin : false),
  credentials: true,
}));
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  const websocketOrigin = new URL(env.wsUrl).origin;
  res.setHeader("Content-Security-Policy", `default-src 'self'; connect-src 'self' ${env.corsOrigin} ${websocketOrigin}; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'`);
  if (env.secureCookies) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});
app.use(express.json({ limit: "1mb" }));
app.use(csrfProtection);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/api/assets/*", async (req, res, next) => {
	try {
		const assetPath = (req.params as Record<string, string>)["0"];
		const response = await proxyAsset(assetPath);
		if (!response.ok || !response.body) {
			return res.status(response.status).end();
		}
		res.status(response.status);
		const contentType = response.headers.get("content-type");
		if (contentType) res.type(contentType);
		const buffer = Buffer.from(await response.arrayBuffer());
		res.send(buffer);
	} catch (err) {
		next(err);
	}
});

app.use("/api/matches", matchesRoutes);
app.use("/api/teams", teamsRoutes);
app.use("/api/players", playersRoutes);
app.use("/api/predictions", predictionsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
