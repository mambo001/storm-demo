import { Effect, Schema } from "effect";

import { ConflictError, NotFoundError } from "@/domain/errors";
import { PasswordHasher, SessionRepository, UserRepository } from "@/domain/ports";
import { AppConfigTag } from "@/shared/config";

export const SignUpInput = Schema.Struct({
  email: Schema.String,
  password: Schema.String,
  companyName: Schema.String,
  contactName: Schema.String,
  phone: Schema.optional(Schema.String),
});

export type SignUpInput = typeof SignUpInput.Type;

export const signUp = (input: SignUpInput) =>
  Effect.gen(function* () {
    const userRepository = yield* UserRepository;
    const sessionRepository = yield* SessionRepository;
    const passwordHasher = yield* PasswordHasher;
    const config = yield* AppConfigTag;
    const normalizedEmail = input.email.trim().toLowerCase();
    const passwordHash = yield* passwordHasher.hash(input.password);
    const now = new Date().toISOString();

    yield* userRepository.findByEmail(normalizedEmail).pipe(
      Effect.flatMap(() => Effect.fail(new ConflictError("Email already exists"))),
      Effect.catchAll((error) =>
        error instanceof NotFoundError ? Effect.void : Effect.fail(error),
      ),
    );

    const user = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      passwordHash,
      companyName: input.companyName,
      contactName: input.contactName,
      phone: input.phone ?? null,
      role: normalizedEmail === config.adminEmail.toLowerCase() ? "admin" : "client",
      createdAt: now,
    } as const;

    const session = {
      id: crypto.randomUUID(),
      userId: user.id,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
      createdAt: now,
    } as const;

    yield* userRepository.create(user);
    yield* sessionRepository.create(session);

    return {
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        companyName: user.companyName,
        contactName: user.contactName,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  });
