import { Effect, Layer } from "effect";

import type { StormEvent } from "@/domain/entities";
import { WeatherProvider } from "@/domain/ports";
import { fetchSpcStorms } from "./noaa-weather-provider";
import { fetchNwsAlerts } from "./nws-alerts-provider";

/**
 * Combined weather provider that merges results from both:
 *   1. SPC storm reports (confirmed past events with precise lat/lng)
 *   2. NWS active alerts (current/upcoming warnings with zone-based coords)
 *
 * Deduplication is handled in-memory by sourceEventId (each source uses a
 * distinct prefix) and at the DB level via the UNIQUE constraint.
 */
export const CombinedWeatherProviderLive = Layer.succeed(WeatherProvider, {
  fetchRecentStorms: () =>
    Effect.gen(function* () {
      const [spcStorms, nwsStorms] = yield* Effect.all(
        [fetchSpcStorms(), fetchNwsAlerts()],
        { concurrency: "unbounded" },
      );

      // Merge and deduplicate by sourceEventId
      const seen = new Set<string>();
      const merged: StormEvent[] = [];

      for (const storm of [...spcStorms, ...nwsStorms]) {
        if (!seen.has(storm.sourceEventId)) {
          seen.add(storm.sourceEventId);
          merged.push(storm);
        }
      }

      return merged;
    }),
});
