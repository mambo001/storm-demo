import { Context, Layer } from "effect";

export interface Env {
  StormDemo: D1Database;
  SESSION_SECRET: string;
  ADMIN_EMAIL?: string;
  WEATHER_MODE?: string;
  ALERT_FROM_EMAIL?: string;
  ALLOWED_ORIGIN?: string;
  ALERT_QUEUE?: Queue;
}

export interface AppConfig {
  readonly sessionSecret: string;
  readonly adminEmail: string;
  readonly weatherMode: "demo" | "noaa";
  readonly alertFromEmail: string;
}

export const D1DatabaseTag = Context.GenericTag<D1Database>("D1Database");
export const AppConfigTag = Context.GenericTag<AppConfig>("AppConfig");

export const makeD1Layer = (env: Env) => Layer.succeed(D1DatabaseTag, env.StormDemo);

export const makeConfigLayer = (env: Env) =>
  Layer.succeed(AppConfigTag, {
    sessionSecret: env.SESSION_SECRET,
    adminEmail: env.ADMIN_EMAIL ?? "admin@stormdemo.local",
    weatherMode: env.WEATHER_MODE === "noaa" ? "noaa" : "demo",
    alertFromEmail: env.ALERT_FROM_EMAIL ?? "alerts@stormdemo.local",
  } satisfies AppConfig);
