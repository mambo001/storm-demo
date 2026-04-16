import { desc, eq, gte } from "drizzle-orm";
import { Effect, Layer } from "effect";

import type { StormEvent } from "@/domain/entities";
import { DatabaseError } from "@/domain/errors";
import { StormEventRepository } from "@/domain/ports";
import { DatabaseTag } from "@/infra/drizzle/client";
import { stormEvents } from "@/infra/drizzle/schema";

const toStormEvent = (row: typeof stormEvents.$inferSelect): StormEvent => ({
  id: row.id,
  source: row.source,
  sourceEventId: row.sourceEventId,
  eventType: row.eventType,
  occurredAt: row.occurredAt,
  lat: row.lat,
  lng: row.lng,
  city: row.city,
  region: row.region,
  severity: row.severity,
  hailSize: row.hailSize,
  windSpeed: row.windSpeed,
  createdAt: row.createdAt,
});

export const D1StormEventRepositoryLive = Layer.effect(
  StormEventRepository,
  Effect.gen(function* () {
    const db = yield* DatabaseTag;

    const upsertMany = (storms: readonly StormEvent[]) =>
      Effect.tryPromise({
        try: async () => {
          for (const storm of storms) {
            await db
              .insert(stormEvents)
              .values({
                id: storm.id,
                source: storm.source,
                sourceEventId: storm.sourceEventId,
                eventType: storm.eventType,
                occurredAt: storm.occurredAt,
                lat: storm.lat,
                lng: storm.lng,
                city: storm.city,
                region: storm.region,
                severity: storm.severity,
                hailSize: storm.hailSize,
                windSpeed: storm.windSpeed,
                createdAt: storm.createdAt,
              })
              .onConflictDoNothing({ target: stormEvents.sourceEventId });
          }
        },
        catch: (error) => new DatabaseError(String(error)),
      }).pipe(Effect.asVoid);

    const listRecent = (sinceIso: string) =>
      Effect.tryPromise({
        try: async () => {
          const rows = await db
            .select()
            .from(stormEvents)
            .where(gte(stormEvents.occurredAt, sinceIso))
            .orderBy(desc(stormEvents.occurredAt));
          return rows.map(toStormEvent);
        },
        catch: (error) => new DatabaseError(String(error)),
      });

    const findById = (id: string) =>
      Effect.tryPromise({
        try: async () => {
          const rows = await db
            .select()
            .from(stormEvents)
            .where(eq(stormEvents.id, id));
          return rows.length > 0 ? toStormEvent(rows[0]) : null;
        },
        catch: (error) => new DatabaseError(String(error)),
      });

    return StormEventRepository.of({ upsertMany, listRecent, findById });
  }),
);
