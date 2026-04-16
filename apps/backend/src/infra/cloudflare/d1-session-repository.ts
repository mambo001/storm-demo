import { eq } from "drizzle-orm";
import { Effect, Layer } from "effect";

import type { Session } from "@/domain/entities";
import { DatabaseError, NotFoundError } from "@/domain/errors";
import { SessionRepository } from "@/domain/ports";
import { DatabaseTag } from "@/infra/drizzle/client";
import { sessions } from "@/infra/drizzle/schema";

const toSession = (row: typeof sessions.$inferSelect): Session => ({
  id: row.id,
  userId: row.userId,
  token: row.token,
  expiresAt: row.expiresAt,
  createdAt: row.createdAt,
});

export const D1SessionRepositoryLive = Layer.effect(
  SessionRepository,
  Effect.gen(function* () {
    const db = yield* DatabaseTag;

    const create = (session: Session) =>
      Effect.tryPromise({
        try: () =>
          db.insert(sessions).values({
            id: session.id,
            userId: session.userId,
            token: session.token,
            expiresAt: session.expiresAt,
            createdAt: session.createdAt,
          }),
        catch: (error) => new DatabaseError(String(error)),
      }).pipe(Effect.asVoid);

    const findByToken = (token: string) =>
      Effect.gen(function* () {
        const rows = yield* Effect.tryPromise({
          try: () =>
            db.select().from(sessions).where(eq(sessions.token, token)),
          catch: (error) => new DatabaseError(String(error)),
        });

        if (rows.length === 0) {
          return yield* Effect.fail(new NotFoundError("Session not found"));
        }

        return toSession(rows[0]);
      });

    const deleteByToken = (token: string) =>
      Effect.tryPromise({
        try: () => db.delete(sessions).where(eq(sessions.token, token)),
        catch: (error) => new DatabaseError(String(error)),
      }).pipe(Effect.asVoid);

    return SessionRepository.of({ create, findByToken, deleteByToken });
  }),
);
