import { env } from "../config/env";

export function publicAssetUrl(url: string | null): string | null {
  if (!url || !url.startsWith(`${env.assetSourceOrigin}/`)) return url;
  return `/api/assets${url.slice(env.assetSourceOrigin.length)}`;
}

export async function proxyAsset(path: string): Promise<Response> {
  const assetUrl = new URL(path, env.assetOrigin);
  if (assetUrl.origin !== new URL(env.assetOrigin).origin) {
    throw new Error("Source asset invalide");
  }
  return fetch(assetUrl);
}