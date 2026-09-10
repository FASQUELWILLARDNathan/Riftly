const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
const API_ORIGIN = new URL(API_URL).origin;
const TOKEN_KEY = "lol-esports-auth-token";
let authToken = localStorage.getItem(TOKEN_KEY);

function setAuthToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function assetUrl(url: string | null): string | null {
  if (!url || !url.startsWith("/")) return url;
  return `${API_ORIGIN}${url}`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include", // envoie/reçoit le cookie httpOnly de session
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Erreur API (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
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
}

export interface TeamSummary {
  pageid: number;
  name: string;
  region: string | null;
  logourl: string | null;
  textlesslogourl: string | null;
  status: string | null;
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
  },
  auth: {
    login: async (email: string, password: string) => {
      const result = await request<{ data: { user: any; token: string } }>(`/auth/login`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAuthToken(result.data.token);
      return result;
    },
    register: async (email: string, username: string, password: string) => {
      const result = await request<{ data: { user: any; token: string } }>(`/auth/register`, {
        method: "POST",
        body: JSON.stringify({ email, username, password }),
      });
      setAuthToken(result.data.token);
      return result;
    },
    logout: async () => {
      await request<void>(`/auth/logout`, { method: "POST" });
      setAuthToken(null);
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
