import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }
  return value;
}

function durationToMilliseconds(value: string): number {
  const match = value.trim().match(/^(\d+)\s*(s|m|h|d|w)?$/i);
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const amount = Number(match[1]);
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  return amount * (multipliers[match[2]?.toLowerCase() ?? "s"] ?? 1000);
}

const jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? "7d";
const jwtSecret = required("JWT_SECRET");

if (process.env.NODE_ENV === "production" && jwtSecret === "change-me-in-production") {
  throw new Error("JWT_SECRET doit être remplacé en production");
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  host: required("HOST"),
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: required("CORS_ORIGIN"),
  assetOrigin: required("ASSET_ORIGIN"),
  assetSourceOrigin: required("ASSET_SOURCE_ORIGIN"),
  apiUrl: required("API_URL"),
  wsUrl: required("WS_URL"),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret,
  jwtExpiresIn,
  jwtCookieMaxAge: durationToMilliseconds(jwtExpiresIn),
};
