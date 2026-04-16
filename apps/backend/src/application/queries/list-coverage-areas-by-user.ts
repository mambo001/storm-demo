import { Effect } from "effect";

import { CoverageAreaRepository } from "@/domain/ports";

export const listCoverageAreasByUser = (userId: string) =>
  Effect.gen(function* () {
    const coverageAreaRepository = yield* CoverageAreaRepository;
    return yield* coverageAreaRepository.listByUserId(userId);
  });
