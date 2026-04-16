import { Effect } from "effect";

import { CoverageAreaRepository, StormEventRepository } from "@/domain/ports";
import { stormMatchesCoverageArea } from "@/domain/services";

export const listRecentStormsForUser = (userId: string, hours = 72) =>
  Effect.gen(function* () {
    const coverageAreaRepository = yield* CoverageAreaRepository;
    const stormEventRepository = yield* StormEventRepository;
    const sinceIso = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const coverageAreas = yield* coverageAreaRepository.listByUserId(userId);
    const storms = yield* stormEventRepository.listRecent(sinceIso);

    return storms.map((storm) => ({
      ...storm,
      matchesCoverage: coverageAreas.some((coverageArea) =>
        stormMatchesCoverageArea(storm, coverageArea),
      ),
    }));
  });
