import { Effect, Layer, Schema } from "effect";

import { User } from "@/domain/entities";
import { ConflictError, DatabaseError, NotFoundError } from "@/domain/errors";
import { UserRepository } from "@/domain/ports";
import { D1DatabaseTag } from "@/shared/config";

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  company_name: string;
  contact_name: string;
  phone: string | null;
  role: "client" | "admin";
  created_at: string;
}

const toUser = (row: UserRow) =>
  Schema.decodeUnknown(User)({
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    companyName: row.company_name,
    contactName: row.contact_name,
    phone: row.phone,
    role: row.role,
    createdAt: row.created_at,
  });

export const D1UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const db = yield* D1DatabaseTag;

    const create = (user: User) =>
      Effect.tryPromise({
        try: () =>
          db
            .prepare(
              "INSERT INTO users (id, email, password_hash, company_name, contact_name, phone, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(
              user.id,
              user.email,
              user.passwordHash,
              user.companyName,
              user.contactName,
              user.phone,
              user.role,
              user.createdAt,
            )
            .run(),
        catch: (error) => {
          const message = String(error);
          return message.includes("UNIQUE")
            ? new ConflictError("User already exists")
            : new DatabaseError(message);
        },
      }).pipe(Effect.asVoid);

    const findByEmail = (email: string) =>
      Effect.gen(function* () {
        const row = yield* Effect.tryPromise({
          try: () =>
            db
              .prepare("SELECT * FROM users WHERE email = ?")
              .bind(email.toLowerCase())
              .first(),
          catch: (error) => new DatabaseError(String(error)),
        });

        if (!row) {
          return yield* Effect.fail(new NotFoundError(`User ${email} not found`));
        }

        return yield* toUser(row as unknown as UserRow);
      });

    const findById = (id: string) =>
      Effect.gen(function* () {
        const row = yield* Effect.tryPromise({
          try: () => db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first(),
          catch: (error) => new DatabaseError(String(error)),
        });

        if (!row) {
          return yield* Effect.fail(new NotFoundError(`User ${id} not found`));
        }

        return yield* toUser(row as unknown as UserRow);
      });

    const listAll = () =>
      Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: () => db.prepare("SELECT * FROM users ORDER BY created_at DESC").all(),
          catch: (error) => new DatabaseError(String(error)),
        });
        const rows = (result as D1Result<Record<string, unknown>>).results as unknown as UserRow[];

        return yield* Schema.decodeUnknown(Schema.Array(User))(
          rows.map((row) => ({
            id: row.id,
            email: row.email,
            passwordHash: row.password_hash,
            companyName: row.company_name,
            contactName: row.contact_name,
            phone: row.phone,
            role: row.role,
            createdAt: row.created_at,
          })),
        );
      });

    return UserRepository.of({ create, findByEmail, findById, listAll });
  }),
);
