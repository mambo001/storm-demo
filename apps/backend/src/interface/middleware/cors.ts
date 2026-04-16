import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";

import type { AppEnv } from "@/app";

export const corsMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const allowedOrigin = c.env?.ALLOWED_ORIGIN;

  const handler = cors({
    origin: allowedOrigin ? allowedOrigin : (origin) => origin || "",
    allowHeaders: ["Content-Type"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  });

  return handler(c, next);
};
