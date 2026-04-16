import { getCookie } from "hono/cookie";
import type { MiddlewareHandler } from "hono";

import { getCurrentUser } from "@/application/queries";
import { runEffect } from "@/app";

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const token = getCookie(c, "stormdemo_session");

  if (!token) {
    console.warn("[auth] Missing session cookie", {
      path: c.req.path,
      method: c.req.method,
      origin: c.req.header("Origin") ?? null,
      host: c.req.header("Host") ?? null,
    });

    return c.json({ message: "Unauthorized: missing session cookie" }, 401);
  }

  try {
    const user = await runEffect(c, getCurrentUser(token));
    c.set("authUser", user);
    c.set("sessionToken", token);
    await next();
  } catch (error) {
    console.warn("[auth] Invalid or expired session", {
      path: c.req.path,
      method: c.req.method,
      error: error instanceof Error ? error.message : String(error),
    });

    return c.json({ message: "Unauthorized: invalid or expired session" }, 401);
  }
};

export const requireAdmin: MiddlewareHandler = async (c, next) => {
  const user = c.get("authUser");

  if (!user || user.role !== "admin") {
    return c.json({ message: "Forbidden" }, 403);
  }

  await next();
};
