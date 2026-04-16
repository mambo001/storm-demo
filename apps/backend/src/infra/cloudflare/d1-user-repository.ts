import { eq } from "drizzle-orm";
import { Effect, Layer } from "effect";

import type { User } from "@/domain/entities";
import { ConflictError, DatabaseError, NotFoundError } from "@/domain/errors";
import { UserRepository } from "@/domain/ports";
import { DatabaseTag } from "@/infra/drizzle/client";
import { users } from "@/infra/drizzle/schema";

const toUser = (row: typeof users.$inferSelect): User => ({
  id: row.id,
  email: row.email,
  passwordHash: row.passwordHash,
  companyName: row.companyName,
  contactName: row.contactName,
  phone: row.phone,
  role: row.role,
  createdAt: row.createdAt,
});

export const D1UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const db = yield* DatabaseTag;

    const create = (user: User) =>
      Effect.tryPromise({
        try: () =>
          db.insert(users).values({
            id: user.id,
            email: user.email,
            passwordHash: user.passwordHash,
            companyName: user.companyName,
            contactName: user.contactName,
            phone: user.phone,
            role: user.role,
            createdAt: user.createdAt,
          }),
        catch: (error) => {
          const message = String(error);
          return message.includes("UNIQUE")
            ? new ConflictError("User already exists")
            : new DatabaseError(message);
        },
      }).pipe(Effect.asVoid);

    const findByEmail = (email: string) =>
      Effect.gen(function* () {
        const rows = yield* Effect.tryPromise({
          try: () =>
            db
              .select()
              .from(users)
              .where(eq(users.email, email.toLowerCase())),
          catch: (error) => new DatabaseError(String(error)),
        });

        if (rows.length === 0) {
          return yield* Effect.fail(new NotFoundError(`User ${email} not found`));
        }

        return toUser(rows[0]);
      });

    const findById = (id: string) =>
      Effect.gen(function* () {
        const rows = yield* Effect.tryPromise({
          try: () => db.select().from(users).where(eq(users.id, id)),
          catch: (error) => new DatabaseError(String(error)),
        });

        if (rows.length === 0) {
          return yield* Effect.fail(new NotFoundError(`User ${id} not found`));
        }

        return toUser(rows[0]);
      });

    const listAll = () =>
      Effect.tryPromise({
        try: async () => {
          const rows = await db
            .select()
            .from(users)
            .orderBy(users.createdAt);
          return rows.map(toUser);
        },
        catch: (error) => new DatabaseError(String(error)),
      });

    return UserRepository.of({ create, findByEmail, findById, listAll });
  }),
);
