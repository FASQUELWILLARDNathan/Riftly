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
  const message = statusCode >= 500 && process.env.NODE_ENV === "production"
    ? "Erreur interne du serveur"
    : err.message || "Erreur interne du serveur";
  res.status(statusCode).json({ error: message });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route inconnue : ${req.method} ${req.path}` });
}
