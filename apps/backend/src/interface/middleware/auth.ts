import { getCookie } from "hono/cookie";
import type { MiddlewareHandler } from "hono";

import { getCurrentUser } from "@/application/queries";
import { runEffect } from "@/app";

const getBearerToken = (authorizationHeader: string | undefined) => {
  if (!authorizationHeader) return null;

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
};

export const getSessionToken = (c: Parameters<MiddlewareHandler>[0]) => {
  const bearerToken = getBearerToken(c.req.header("Authorization"));

  if (bearerToken) {
    return bearerToken;
  }

  return getCookie(c, "stormdemo_session") ?? null;
};

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const token = getSessionToken(c);

  if (!token) {
    console.warn("[auth] Missing session token", {
      path: c.req.path,
      method: c.req.method,
      origin: c.req.header("Origin") ?? null,
      host: c.req.header("Host") ?? null,
    });

    return c.json({ message: "Unauthorized: missing session token" }, 401);
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
