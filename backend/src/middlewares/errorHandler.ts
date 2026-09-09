import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

interface HttpError extends Error {
  statusCode?: number;
}

export function errorHandler(err: HttpError, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Données invalides", details: err.flatten() });
  }

  const statusCode = err.statusCode ?? 500;
  if (statusCode >= 500) {
    console.error(`[${req.method} ${req.path}]`, err);
  }

  res.status(statusCode).json({ error: err.message || "Erreur interne du serveur" });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route inconnue : ${req.method} ${req.path}` });
}
