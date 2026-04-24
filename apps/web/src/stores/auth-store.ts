import { create } from "zustand";

import { api, clearSessionToken, storeSessionToken, type UserDto } from "@/lib/api";

interface AuthState {
  readonly user: UserDto | null;
  readonly authMode: "login" | "signup";
  readonly busy: boolean;
  readonly error: string | null;
  readonly initialized: boolean;

  setAuthMode: (mode: "login" | "signup") => void;
  checkSession: () => Promise<void>;
  signup: (payload: {
    email: string;
    password: string;
    companyName: string;
    contactName: string;
    phone?: string;
  }) => Promise<void>;
  login: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authMode: "signup",
  busy: false,
  error: null,
  initialized: false,

  setAuthMode: (mode) => set({ authMode: mode }),

  checkSession: async () => {
    try {
      const response = await api.me();
      set({ user: response.user, initialized: true });
    } catch {
      set({ user: null, initialized: true });
    }
  },

  signup: async (payload) => {
    set({ busy: true, error: null });
    try {
      const response = await api.signup(payload);
      storeSessionToken(response.token);
      set({ user: response.user, busy: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Unable to sign up",
        busy: false,
      });
      throw err;
    }
  },

  login: async (payload) => {
    set({ busy: true, error: null });
    try {
      const response = await api.login(payload);
      storeSessionToken(response.token);
      set({ user: response.user, busy: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Unable to log in",
        busy: false,
      });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } finally {
      clearSessionToken();
      set({ user: null });
    }
  },
}));
