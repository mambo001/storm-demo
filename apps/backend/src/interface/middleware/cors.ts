import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";

import type { Env } from "@/shared/config/env";

/**
 * In production, ALLOWED_ORIGIN should be set to the frontend URL
 * (e.g. "https://storm-demo.pages.dev" or "https://stormdemo.com").
 *
 * In local dev it falls back to reflecting the request origin so that
 * localhost:5173 -> localhost:8787 works without configuration.
 */
export const corsMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (
  c,
  next,
) => {
  const allowedOrigin = c.env?.ALLOWED_ORIGIN;

  const handler = cors({
    origin: allowedOrigin
      ? [allowedOrigin, "http://localhost:5173", "http://127.0.0.1:5173"]
      : (origin) => origin ?? "http://localhost:5173",
    allowHeaders: ["Content-Type"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  });

  return handler(c, next);
};
