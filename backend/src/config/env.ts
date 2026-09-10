import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }
  return value;
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
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
};
