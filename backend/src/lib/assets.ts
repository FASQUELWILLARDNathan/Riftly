import { env } from "../config/env";

const sourceOrigin = "http://51.38.38.87:3070";

export function publicAssetUrl(url: string | null): string | null {
  if (!url || !url.startsWith(`${sourceOrigin}/`)) return url;
  return `/api/assets${url.slice(sourceOrigin.length)}`;
}

export async function proxyAsset(path: string): Promise<Response> {
  const assetUrl = new URL(path, env.assetOrigin);
  if (assetUrl.origin !== new URL(env.assetOrigin).origin) {
    throw new Error("Source asset invalide");
  }
  return fetch(assetUrl);
}