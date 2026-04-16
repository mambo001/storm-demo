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
  users: Array<Pick<UserDto, "id" | "email" | "companyName" | "contactName" | "role">>;
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8787";

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "Request failed" }));
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
  }) => request<{ user: UserDto }>("/auth/signup", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload: { email: string; password: string }) =>
    request<{ user: UserDto }>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),
  listCoverageAreas: () => request<{ coverageAreas: CoverageAreaDto[] }>("/coverage-areas"),
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
  ingestStorms: () => request<{ imported: number }>("/admin/ingest", { method: "POST" }),
  sendTestAlert: (payload: { userId: string; stormEventId: string }) =>
    request<{ alert: { id: string } }>("/admin/alerts/test", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
