import { create } from "zustand";

import { api, type StormDto } from "@/lib/api";

interface StormState {
  readonly storms: StormDto[];
  readonly busy: boolean;

  load: () => Promise<void>;
  reset: () => void;
}

export const useStormStore = create<StormState>((set) => ({
  storms: [],
  busy: false,

  load: async () => {
    set({ busy: true });
    try {
      const response = await api.listStorms();
      set({ storms: response.storms, busy: false });
    } catch {
      set({ busy: false });
    }
  },

  reset: () => set({ storms: [] }),
}));

/** Selector: storms that match the user's coverage areas */
export const selectMatchingStorms = (state: StormState) =>
  state.storms.filter((s) => s.matchesCoverage);
