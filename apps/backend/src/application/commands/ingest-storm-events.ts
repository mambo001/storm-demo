import { Effect } from "effect";

import { StormEventRepository, WeatherProvider } from "@/domain/ports";

export const ingestStormEvents = () =>
  Effect.gen(function* () {
    const weatherProvider = yield* WeatherProvider;
    const stormEventRepository = yield* StormEventRepository;
    const storms = yield* weatherProvider.fetchRecentStorms();
    yield* stormEventRepository.upsertMany(storms);

    return { imported: storms.length };
  });
