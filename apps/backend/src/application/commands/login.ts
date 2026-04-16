import { Effect, Schema } from "effect";

import { AuthenticationError } from "@/domain/errors";
import { PasswordHasher, SessionRepository, UserRepository } from "@/domain/ports";

export const LoginInput = Schema.Struct({
  email: Schema.String,
  password: Schema.String,
});

export type LoginInput = typeof LoginInput.Type;

export const login = (input: LoginInput) =>
  Effect.gen(function* () {
    const userRepository = yield* UserRepository;
    const passwordHasher = yield* PasswordHasher;
    const sessionRepository = yield* SessionRepository;
    const user = yield* userRepository.findByEmail(input.email.trim().toLowerCase());
    const isValid = yield* passwordHasher.verify(input.password, user.passwordHash);

    if (!isValid) {
      return yield* Effect.fail(new AuthenticationError("Invalid credentials"));
    }

    const now = new Date().toISOString();
    const session = {
      id: crypto.randomUUID(),
      userId: user.id,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
      createdAt: now,
    } as const;

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
