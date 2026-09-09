import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { proxyAsset } from "./lib/assets";

import matchesRoutes from "./modules/matches/matches.routes";
import teamsRoutes from "./modules/teams/teams.routes";
import playersRoutes from "./modules/players/players.routes";
import predictionsRoutes from "./modules/predictions/predictions.routes";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";

export const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());

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
