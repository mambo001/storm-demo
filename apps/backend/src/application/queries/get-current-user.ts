import { Effect } from "effect";

import { AuthenticationError } from "@/domain/errors";
import { SessionRepository, UserRepository } from "@/domain/ports";

export const getCurrentUser = (token: string) =>
  Effect.gen(function* () {
    const sessionRepository = yield* SessionRepository;
    const userRepository = yield* UserRepository;
    const session = yield* sessionRepository.findByToken(token);

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      return yield* Effect.fail(new AuthenticationError("Session expired"));
    }

    const user = yield* userRepository.findById(session.userId);

    return {
      id: user.id,
      email: user.email,
      companyName: user.companyName,
      contactName: user.contactName,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };
  });
