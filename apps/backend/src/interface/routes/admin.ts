import { Hono } from "hono";

import { ingestStormEvents, triggerManualAlert } from "@/application/commands";
import { getWeatherDebug, listAdminSummary } from "@/application/queries";
import { runEffect, type AppEnv } from "@/app";
import { requireAdmin, requireAuth } from "@/interface/middleware/auth";

export const adminRoutes = new Hono<AppEnv>();

adminRoutes.use("*", requireAuth, requireAdmin);

adminRoutes.get("/summary", async (c) => {
  const summary = await runEffect(c, listAdminSummary());

  return c.json(summary);
});

adminRoutes.get("/weather-debug", async (c) => {
  const debug = await runEffect(c, getWeatherDebug());

  return c.json(debug);
});

adminRoutes.post("/ingest", async (c) => {
  const result = await runEffect(c, ingestStormEvents());

  return c.json(result);
});

adminRoutes.post("/alerts/test", async (c) => {
  const body = await c.req.json<{ userId?: string; stormEventId?: string }>();
  if (!body.userId || !body.stormEventId) {
    return c.json({ message: "userId and stormEventId are required" }, 400);
  }

  const alert = await runEffect(c, triggerManualAlert(body.userId, body.stormEventId));

  return c.json({ alert }, 201);
});
