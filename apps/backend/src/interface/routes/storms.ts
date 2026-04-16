import { Hono } from "hono";

import { listRecentStormsForUser } from "@/application/queries";
import { runEffect, type AppEnv } from "@/app";
import { requireAuth } from "@/interface/middleware/auth";

export const stormRoutes = new Hono<AppEnv>();

stormRoutes.use("*", requireAuth);

stormRoutes.get("/", async (c) => {
  const user = c.get("authUser");
  const hours = Number(c.req.query("hours") ?? "72");
  const storms = await runEffect(c, listRecentStormsForUser(user.id, Number.isFinite(hours) ? hours : 72));

  return c.json({ storms });
});
