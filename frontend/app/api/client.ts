let apiUrl: string | null = null;
let apiOrigin: string | null = null;

function clearLegacyAuthStorage() {
  if (!import.meta.client) return;
  localStorage.removeItem("lol-esports-auth-token");
  sessionStorage.removeItem("lol-esports-auth-token");
}

clearLegacyAuthStorage();

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function configureApi(baseUrl: string) {
  apiUrl = baseUrl.replace(/\/$/, "");
  apiOrigin = new URL(apiUrl).origin;
}

function getApiUrl() {
  if (!apiUrl) throw new Error("Client API non initialisé");
  return apiUrl;
}

export function assetUrl(url: string | null): string | null {
  if (!url || !url.startsWith("/")) return url;
  if (!apiOrigin) throw new Error("Client API non initialisé");
  return `${apiOrigin}${url}`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    credentials: "include", // envoie/reçoit le cookie httpOnly de session
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? `Erreur API (${res.status})`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface TeamLogoInfo {
  name: string;
  logourl: string | null;
  logodarkurl: string | null;
  textlesslogourl: string | null;
  textlesslogodarkurl: string | null;
}

export interface TeamSummary {
  pageid: number;
  name: string;
  region: string | null;
  logourl: string | null;
  logodarkurl: string | null;
  textlesslogourl: string | null;
  textlesslogodarkurl: string | null;
  status: string | null;
}

export interface MatchSummary {
  id: string;
  date: string | null;
  tournament: string | null;
  region: string;
  status: string | null;
  finished: boolean | null;
  winner: string | null;
  bestOf: number | null;
  teams: string[];
  teamLogos?: TeamLogoInfo[];
}

export const api = {
  matches: {
    list: (status: "live" | "upcoming" | "finished", params: { team?: string; region?: string } = {}) => {
      const qs = new URLSearchParams({ status, ...params });
      return request<{ data: MatchSummary[] }>(`/matches?${qs}`);
    },
    detail: (id: string) => request<{ data: any }>(`/matches/${encodeURIComponent(id)}`),
  },
  teams: {
    list: (q?: string) => request<{ data: TeamSummary[] }>(`/teams${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    detail: (pageid: number) => request<{ data: any }>(`/teams/${pageid}`),
  },
  players: {
    list: (q?: string) => request<{ data: any[] }>(`/players${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    detail: (pageid: string) => request<{ data: any }>(`/players/${pageid}`),
  },
  predictions: {
    get: (matchId: string) => request<{ data: any }>(`/predictions/${encodeURIComponent(matchId)}`),
    myVote: (matchId: string) => request<{ data: { predictedWinner: 1 | 2 } | null }>(`/predictions/vote/${encodeURIComponent(matchId)}`),
    vote: (matchId: string, predictedWinner: 1 | 2) =>
      request(`/predictions/vote`, { method: "POST", body: JSON.stringify({ matchId, predictedWinner }) }),
    getVote: (matchId: string) =>
      request<{ data: { predictedWinner: number } | null }>(`/predictions/${encodeURIComponent(matchId)}/vote`),
  },
  auth: {
    login: async (email: string, password: string) => {
      return request<{ data: { user: any } }>(`/auth/login`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },
    register: async (email: string, username: string, password: string) => {
      return request<{ data: { user: any } }>(`/auth/register`, {
        method: "POST",
        body: JSON.stringify({ email, username, password }),
      });
    },
    logout: async () => {
      try {
        await request<void>(`/auth/logout`, { method: "POST" });
      } finally {
        clearLegacyAuthStorage();
      }
    },
  },
  users: {
    me: () => request<{ data: any }>(`/users/me`),
    updateProfile: (data: { username?: string; email?: string }) =>
      request<{ data: any }>(`/users/me`, { method: "PATCH", body: JSON.stringify(data) }),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<void>(`/users/me/password`, {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
  },
};
