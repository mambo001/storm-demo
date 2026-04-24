export interface UserDto {
  id: string;
  email: string;
  companyName: string;
  contactName: string;
  phone: string | null;
  role: "client" | "admin";
  createdAt: string;
}

export interface CoverageAreaDto {
  id: string;
  userId: string;
  label: string;
  centerLat: number;
  centerLng: number;
  radiusMiles: number;
  threshold: "light" | "moderate" | "severe";
  createdAt: string;
}

export interface StormDto {
  id: string;
  source: string;
  sourceEventId: string;
  eventType: "hail" | "wind";
  severity: "light" | "moderate" | "severe";
  occurredAt: string;
  lat: number;
  lng: number;
  city: string;
  region: string;
  hailSize: number | null;
  windSpeed: number | null;
  matchesCoverage: boolean;
}

export interface AdminSummaryDto {
  metrics: {
    clients: number;
    admins: number;
    coverageAreas: number;
    recentStorms: number;
    alerts: number;
  };
  users: Array<
    Pick<UserDto, "id" | "email" | "companyName" | "contactName" | "role">
  >;
  alerts: Array<{
    id: string;
    userId: string;
    stormEventId: string;
    status: string;
    message: string;
    createdAt: string;
  }>;
  storms: StormDto[];
}

export interface WeatherDebugDto {
  weatherMode: "demo" | "noaa";
  liveFeedCount: number;
  dbRecentCount: number;
  sources: {
    spc: number;
    nws: number;
    demo: number;
  };
  sampleEvents: Array<{
    source: string;
    eventType: string;
    severity: string;
    city: string;
    region: string;
    occurredAt: string;
    lat: number;
    lng: number;
    hailSize: number | null;
    windSpeed: number | null;
  }>;
}

export interface AuthResponseDto {
  user: UserDto;
  token: string;
}

const inferApiBaseUrl = () => {
  if (typeof window === "undefined") return "http://127.0.0.1:8787";

  const { hostname, protocol } = window.location;

  // Local development
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `http://${hostname}:8787`;
  }

  // Production: assume API is on api. subdomain of the same root domain
  return `${protocol}//api.${hostname}`;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || inferApiBaseUrl();
const SESSION_TOKEN_KEY = "stormdemo_session_token";

const getStoredSessionToken = () => {
  if (typeof window === "undefined") return null;

  return window.localStorage.getItem(SESSION_TOKEN_KEY);
};

export const storeSessionToken = (token: string) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(SESSION_TOKEN_KEY, token);
};

export const clearSessionToken = () => {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(SESSION_TOKEN_KEY);
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const token = getStoredSessionToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearSessionToken();
    }

    const body = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(body.message ?? "Request failed");
  }

  return response.json() as Promise<T>;
};

export const api = {
  me: () => request<{ user: UserDto }>("/auth/me"),
  signup: (payload: {
    email: string;
    password: string;
    companyName: string;
    contactName: string;
    phone?: string;
  }) =>
    request<AuthResponseDto>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    request<AuthResponseDto>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),
  listCoverageAreas: () =>
    request<{ coverageAreas: CoverageAreaDto[] }>("/coverage-areas"),
  createCoverageArea: (payload: {
    label: string;
    centerLat: number;
    centerLng: number;
    radiusMiles: number;
    threshold: "light" | "moderate" | "severe";
  }) =>
    request<{ coverageArea: CoverageAreaDto }>("/coverage-areas", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listStorms: () => request<{ storms: StormDto[] }>("/storms"),
  adminSummary: () => request<AdminSummaryDto>("/admin/summary"),
  ingestStorms: () =>
    request<{ imported: number }>("/admin/ingest", { method: "POST" }),
  sendTestAlert: (payload: { userId: string; stormEventId: string }) =>
    request<{ alert: { id: string } }>("/admin/alerts/test", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  weatherDebug: () => request<WeatherDebugDto>("/admin/weather-debug"),
};
