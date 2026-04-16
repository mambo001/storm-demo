import { create } from "zustand";

import { api, type CoverageAreaDto } from "@/lib/api";

export interface CoverageFormState {
  readonly label: string;
  readonly centerLat: number;
  readonly centerLng: number;
  readonly radiusMiles: number;
  readonly threshold: "light" | "moderate" | "severe";
}

const defaultForm: CoverageFormState = {
  label: "Dallas coverage",
  centerLat: 32.7767,
  centerLng: -96.797,
  radiusMiles: 50,
  threshold: "moderate",
};

interface CoverageState {
  readonly areas: CoverageAreaDto[];
  readonly form: CoverageFormState;
  readonly busy: boolean;
  readonly error: string | null;

  load: () => Promise<void>;
  create: () => Promise<void>;
  updateField: <K extends keyof CoverageFormState>(
    field: K,
    value: CoverageFormState[K],
  ) => void;
  reset: () => void;
}

export const useCoverageStore = create<CoverageState>((set, get) => ({
  areas: [],
  form: defaultForm,
  busy: false,
  error: null,

  load: async () => {
    try {
      const response = await api.listCoverageAreas();
      set({ areas: response.coverageAreas });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load coverage areas" });
    }
  },

  create: async () => {
    set({ busy: true, error: null });
    try {
      await api.createCoverageArea(get().form);
      set({ form: defaultForm, busy: false });
      await get().load();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Unable to save coverage area",
        busy: false,
      });
    }
  },

  updateField: (field, value) => {
    set((state) => ({ form: { ...state.form, [field]: value } }));
  },

  reset: () => set({ areas: [], form: defaultForm, error: null }),
}));
