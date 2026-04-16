import { cors } from "hono/cors";

export const corsMiddleware = cors({
  origin: (origin) => origin || "*",
  allowHeaders: ["Content-Type"],
  allowMethods: ["GET", "POST", "OPTIONS"],
  credentials: true,
});
