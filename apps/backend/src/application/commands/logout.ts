import { Effect } from "effect";

import { SessionRepository } from "@/domain/ports";

export const logout = (token: string) =>
  Effect.gen(function* () {
    const sessionRepository = yield* SessionRepository;
    yield* sessionRepository.deleteByToken(token);
  });
