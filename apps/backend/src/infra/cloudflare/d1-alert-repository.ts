import { desc } from "drizzle-orm";
import { Effect, Layer } from "effect";

import type { Alert } from "@/domain/entities";
import { DatabaseError } from "@/domain/errors";
import { AlertRepository } from "@/domain/ports";
import { DatabaseTag } from "@/infra/drizzle/client";
import { alerts } from "@/infra/drizzle/schema";

const toAlert = (row: typeof alerts.$inferSelect): Alert => ({
  id: row.id,
  userId: row.userId,
  stormEventId: row.stormEventId,
  channel: row.channel,
  status: row.status,
  message: row.message,
  createdAt: row.createdAt,
});

export const D1AlertRepositoryLive = Layer.effect(
  AlertRepository,
  Effect.gen(function* () {
    const db = yield* DatabaseTag;

    const create = (alert: Alert) =>
      Effect.tryPromise({
        try: () =>
          db.insert(alerts).values({
            id: alert.id,
            userId: alert.userId,
            stormEventId: alert.stormEventId,
            channel: alert.channel,
            status: alert.status,
            message: alert.message,
            createdAt: alert.createdAt,
          }),
        catch: (error) => new DatabaseError(String(error)),
      }).pipe(Effect.asVoid);

    const listRecent = () =>
      Effect.tryPromise({
        try: async () => {
          const rows = await db
            .select()
            .from(alerts)
            .orderBy(desc(alerts.createdAt))
            .limit(25);
          return rows.map(toAlert);
        },
        catch: (error) => new DatabaseError(String(error)),
      });

    return AlertRepository.of({ create, listRecent });
  }),
);
