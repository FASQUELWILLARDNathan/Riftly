import { PrismaClient } from "@prisma/client";

// Singleton : évite d'ouvrir un nouveau pool de connexions à chaque
// hot-reload en dev (contrairement au bot Python qui ouvrait une
// connexion psycopg par appel de fonction).
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV === "development") {
  global.__prisma = prisma;
}
