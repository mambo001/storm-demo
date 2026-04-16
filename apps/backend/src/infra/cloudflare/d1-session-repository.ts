import { Effect, Layer, Schema } from "effect";

import { Session } from "@/domain/entities";
import { DatabaseError, NotFoundError } from "@/domain/errors";
import { SessionRepository } from "@/domain/ports";
import { D1DatabaseTag } from "@/shared/config";

interface SessionRow {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

const toSession = (row: SessionRow) =>
  Schema.decodeUnknown(Session)({
    id: row.id,
    userId: row.user_id,
    token: row.token,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  });

export const D1SessionRepositoryLive = Layer.effect(
  SessionRepository,
  Effect.gen(function* () {
    const db = yield* D1DatabaseTag;

    const create = (session: Session) =>
      Effect.tryPromise({
        try: () =>
          db
            .prepare(
              "INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
            )
            .bind(
              session.id,
              session.userId,
              session.token,
              session.expiresAt,
              session.createdAt,
            )
            .run(),
        catch: (error) => new DatabaseError(String(error)),
      }).pipe(Effect.asVoid);

    const findByToken = (token: string) =>
      Effect.gen(function* () {
        const row = yield* Effect.tryPromise({
          try: () =>
            db
              .prepare("SELECT * FROM sessions WHERE token = ?")
              .bind(token)
              .first(),
          catch: (error) => new DatabaseError(String(error)),
        });

        if (!row) {
          return yield* Effect.fail(new NotFoundError("Session not found"));
        }

        return yield* toSession(row as unknown as SessionRow);
      });

    const deleteByToken = (token: string) =>
      Effect.tryPromise({
        try: () => db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run(),
        catch: (error) => new DatabaseError(String(error)),
      }).pipe(Effect.asVoid);

    return SessionRepository.of({ create, findByToken, deleteByToken });
  }),
);
