import { Effect } from "effect";

import { StormEventRepository, WeatherProvider } from "@/domain/ports";
import { AppConfigTag } from "@/shared/config/env";

export const getWeatherDebug = () =>
  Effect.gen(function* () {
    const config = yield* AppConfigTag;
    const weatherProvider = yield* WeatherProvider;
    const stormEventRepository = yield* StormEventRepository;

    const [liveFeed, dbRecent] = yield* Effect.all([
      weatherProvider.fetchRecentStorms().pipe(Effect.catchAll(() => Effect.succeed([] as const))),
      stormEventRepository.listRecent(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    // Break down counts by source
    const spcCount = liveFeed.filter((e) => e.source === "noaa-spc").length;
    const nwsCount = liveFeed.filter((e) => e.source === "nws-alerts").length;
    const demoCount = liveFeed.filter((e) => e.source === "demo").length;

    return {
      weatherMode: config.weatherMode,
      liveFeedCount: liveFeed.length,
      dbRecentCount: dbRecent.length,
      sources: {
        spc: spcCount,
        nws: nwsCount,
        demo: demoCount,
      },
      sampleEvents: liveFeed.slice(0, 10).map((event) => ({
        source: event.source,
        eventType: event.eventType,
        severity: event.severity,
        city: event.city,
        region: event.region,
        occurredAt: event.occurredAt,
        lat: event.lat,
        lng: event.lng,
        hailSize: event.hailSize,
        windSpeed: event.windSpeed,
      })),
    };
  });
