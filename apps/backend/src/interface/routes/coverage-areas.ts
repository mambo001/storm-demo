import { Effect, Schema } from "effect";
import { Hono } from "hono";

import { createCoverageArea, CreateCoverageAreaInput } from "@/application/commands";
import { listCoverageAreasByUser } from "@/application/queries";
import { runEffect, type AppEnv } from "@/app";
import { requireAuth } from "@/interface/middleware/auth";

const decodeCoverageBody = Schema.decodeUnknown(CreateCoverageAreaInput);

export const coverageAreaRoutes = new Hono<AppEnv>();

coverageAreaRoutes.use("*", requireAuth);

coverageAreaRoutes.get("/", async (c) => {
  const user = c.get("authUser");
  const coverageAreas = await runEffect(c, listCoverageAreasByUser(user.id));

  return c.json({ coverageAreas });
});

coverageAreaRoutes.post("/", async (c) => {
  const user = c.get("authUser");
  const rawBody = await c.req.json();
  const program = Effect.gen(function* () {
    const body = yield* decodeCoverageBody(rawBody);
    return yield* createCoverageArea(user.id, body);
  });

  const coverageArea = await runEffect(c, program);

  return c.json({ coverageArea }, 201);
});
