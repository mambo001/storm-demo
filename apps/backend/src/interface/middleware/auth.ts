import { getCookie } from "hono/cookie";
import type { MiddlewareHandler } from "hono";

import { getCurrentUser } from "@/application/queries";
import { runEffect } from "@/app";

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const token = getCookie(c, "stormdemo_session");

  if (!token) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const user = await runEffect(c, getCurrentUser(token));
    c.set("authUser", user);
    c.set("sessionToken", token);
    await next();
  } catch {
    return c.json({ message: "Unauthorized" }, 401);
  }
};

export const requireAdmin: MiddlewareHandler = async (c, next) => {
  const user = c.get("authUser");

  if (!user || user.role !== "admin") {
    return c.json({ message: "Forbidden" }, 403);
  }

  await next();
};
