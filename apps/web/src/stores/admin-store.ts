import { create } from "zustand";

import { api, type AdminSummaryDto, type WeatherDebugDto } from "@/lib/api";

interface AdminState {
  readonly summary: AdminSummaryDto | null;
  readonly weatherDebug: WeatherDebugDto | null;
  readonly busy: boolean;
  readonly error: string | null;

  load: () => Promise<void>;
  ingest: () => Promise<void>;
  sendTestAlert: () => Promise<void>;
  reset: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  summary: null,
  weatherDebug: null,
  busy: false,
  error: null,

  load: async () => {
    try {
      const [summary, debug] = await Promise.all([
        api.adminSummary(),
        api.weatherDebug(),
      ]);
      set({ summary, weatherDebug: debug });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load admin data" });
    }
  },

  ingest: async () => {
    set({ busy: true, error: null });
    try {
      await api.ingestStorms();
      set({ busy: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Unable to ingest storms",
        busy: false,
      });
    }
  },

  sendTestAlert: async () => {
    const { summary } = get();
    if (!summary?.users[0] || !summary.storms[0]) return;

    set({ busy: true, error: null });
    try {
      await api.sendTestAlert({
        userId: summary.users[0].id,
        stormEventId: summary.storms[0].id,
      });
      const updated = await api.adminSummary();
      set({ summary: updated, busy: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Unable to send alert",
        busy: false,
      });
    }
  },

  reset: () => set({ summary: null, weatherDebug: null, error: null }),
}));
