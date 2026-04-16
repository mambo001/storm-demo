import { CssBaseline, ThemeProvider } from "@mui/material";
import { Suspense, lazy, useEffect, useRef } from "react";

import { appTheme } from "@/app/theme";
import { useAdminStore } from "@/stores/admin-store";
import { useAuthStore } from "@/stores/auth-store";
import { useCoverageStore } from "@/stores/coverage-store";
import { useStormStore } from "@/stores/storm-store";

const AuthView = lazy(async () =>
  import("@/app/components/auth-view").then((m) => ({ default: m.AuthView })),
);
const Dashboard = lazy(async () =>
  import("@/app/components/dashboard").then((m) => ({ default: m.Dashboard })),
);

export function App() {
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const checkSession = useAuthStore((s) => s.checkSession);
  const prevUserId = useRef<string | null>(null);

  // Check session on mount
  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  // Load data when user logs in, reset when they log out
  useEffect(() => {
    if (!initialized) return;

    if (user && user.id !== prevUserId.current) {
      // User just authenticated — load data
      void Promise.all([
        useCoverageStore.getState().load(),
        useStormStore.getState().load(),
        ...(user.role === "admin" ? [useAdminStore.getState().load()] : []),
      ]);
    } else if (!user && prevUserId.current) {
      // User just logged out — reset stores
      useCoverageStore.getState().reset();
      useStormStore.getState().reset();
      useAdminStore.getState().reset();
    }

    prevUserId.current = user?.id ?? null;
  }, [user, initialized]);

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Suspense fallback={null}>
        {!initialized ? null : user ? <Dashboard /> : <AuthView />}
      </Suspense>
    </ThemeProvider>
  );
}
