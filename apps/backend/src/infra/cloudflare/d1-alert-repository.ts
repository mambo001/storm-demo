import { Effect, Layer, Schema } from "effect";

import { Alert } from "@/domain/entities";
import { DatabaseError } from "@/domain/errors";
import { AlertRepository } from "@/domain/ports";
import { D1DatabaseTag } from "@/shared/config";

interface AlertRow {
  id: string;
  user_id: string;
  storm_event_id: string;
  channel: "email";
  status: "queued" | "sent" | "failed";
  message: string;
  created_at: string;
}

const toAlert = (row: AlertRow) => ({
  id: row.id,
  userId: row.user_id,
  stormEventId: row.storm_event_id,
  channel: row.channel,
  status: row.status,
  message: row.message,
  createdAt: row.created_at,
});

export const D1AlertRepositoryLive = Layer.effect(
  AlertRepository,
  Effect.gen(function* () {
    const db = yield* D1DatabaseTag;

    const create = (alert: Alert) =>
      Effect.tryPromise({
        try: () =>
          db
            .prepare(
              "INSERT INTO alerts (id, user_id, storm_event_id, channel, status, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(
              alert.id,
              alert.userId,
              alert.stormEventId,
              alert.channel,
              alert.status,
              alert.message,
              alert.createdAt,
            )
            .run(),
        catch: (error) => new DatabaseError(String(error)),
      }).pipe(Effect.asVoid);

    const listRecent = () =>
      Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: () => db.prepare("SELECT * FROM alerts ORDER BY created_at DESC LIMIT 25").all(),
          catch: (error) => new DatabaseError(String(error)),
        });
        const rows = (result as D1Result<Record<string, unknown>>).results as unknown as AlertRow[];

        return yield* Schema.decodeUnknown(Schema.Array(Alert))(rows.map(toAlert));
      });

    return AlertRepository.of({ create, listRecent });
  }),
);
