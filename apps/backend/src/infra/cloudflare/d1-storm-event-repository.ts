import { Effect, Layer, Schema } from "effect";

import { StormEvent } from "@/domain/entities";
import { DatabaseError } from "@/domain/errors";
import { StormEventRepository } from "@/domain/ports";
import { D1DatabaseTag } from "@/shared/config";

interface StormEventRow {
  id: string;
  source: string;
  source_event_id: string;
  event_type: "hail" | "wind";
  occurred_at: string;
  lat: number;
  lng: number;
  city: string;
  region: string;
  severity: "light" | "moderate" | "severe";
  hail_size: number | null;
  wind_speed: number | null;
  created_at: string;
}

const toStormEvent = (row: StormEventRow) => ({
  id: row.id,
  source: row.source,
  sourceEventId: row.source_event_id,
  eventType: row.event_type,
  occurredAt: row.occurred_at,
  lat: row.lat,
  lng: row.lng,
  city: row.city,
  region: row.region,
  severity: row.severity,
  hailSize: row.hail_size,
  windSpeed: row.wind_speed,
  createdAt: row.created_at,
});

export const D1StormEventRepositoryLive = Layer.effect(
  StormEventRepository,
  Effect.gen(function* () {
    const db = yield* D1DatabaseTag;

    const upsertMany = (storms: readonly StormEvent[]) =>
      Effect.forEach(storms, (storm) =>
        Effect.tryPromise({
          try: () =>
            db
              .prepare(
                "INSERT OR IGNORE INTO storm_events (id, source, source_event_id, event_type, occurred_at, lat, lng, city, region, severity, hail_size, wind_speed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              )
              .bind(
                storm.id,
                storm.source,
                storm.sourceEventId,
                storm.eventType,
                storm.occurredAt,
                storm.lat,
                storm.lng,
                storm.city,
                storm.region,
                storm.severity,
                storm.hailSize,
                storm.windSpeed,
                storm.createdAt,
              )
              .run(),
          catch: (error) => new DatabaseError(String(error)),
        }),
      ).pipe(Effect.asVoid);

    const listRecent = (sinceIso: string) =>
      Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: () =>
            db
              .prepare(
                "SELECT * FROM storm_events WHERE occurred_at >= ? ORDER BY occurred_at DESC",
              )
              .bind(sinceIso)
              .all(),
          catch: (error) => new DatabaseError(String(error)),
        });
        const rows = (result as D1Result<Record<string, unknown>>).results as unknown as StormEventRow[];

        return yield* Schema.decodeUnknown(Schema.Array(StormEvent))(
          rows.map(toStormEvent),
        );
      });

    const findById = (id: string) =>
      Effect.gen(function* () {
        const row = yield* Effect.tryPromise({
          try: () => db.prepare("SELECT * FROM storm_events WHERE id = ?").bind(id).first(),
          catch: (error) => new DatabaseError(String(error)),
        });

        if (!row) {
          return null;
        }

        return yield* Schema.decodeUnknown(StormEvent)(toStormEvent(row as unknown as StormEventRow));
      });

    return StormEventRepository.of({ upsertMany, listRecent, findById });
  }),
);
