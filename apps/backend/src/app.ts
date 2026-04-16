import { Hono } from "hono";
import { Effect, ManagedRuntime } from "effect";

import { adminRoutes, authRoutes, coverageAreaRoutes, stormRoutes } from "@/interface/routes";
import { corsMiddleware } from "@/interface/middleware/cors";
import { makeAppLayer } from "@/layers";
import type { Env } from "@/shared/config";

export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly companyName: string;
  readonly contactName: string;
  readonly phone: string | null;
  readonly role: "client" | "admin";
  readonly createdAt: string;
}

export type AppEnv = {
  Bindings: Env;
  Variables: {
    authUser: AuthUser;
    sessionToken: string;
  };
};

export type AppBindings = AppEnv;

export const makeAppRuntime = (env: Env) => ManagedRuntime.make(makeAppLayer(env));

export const runEffect = <A, E, R>(c: { env: Env }, effect: Effect.Effect<A, E, R>) => {
  const runtime = makeAppRuntime(c.env) as ManagedRuntime.ManagedRuntime<any, any>;

  return runtime.runPromise(effect as Effect.Effect<A, E, never>) as Promise<A>;
};

const app = new Hono<AppEnv>();

app.use("*", corsMiddleware);

app.route("/auth", authRoutes);
app.route("/coverage-areas", coverageAreaRoutes);
app.route("/storms", stormRoutes);
app.route("/admin", adminRoutes);

app.get("/health", (c) => c.json({ status: "ok" }));

export default app;
