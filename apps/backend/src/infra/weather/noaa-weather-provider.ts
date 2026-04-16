import { Effect, Layer } from "effect";

import { WeatherProvider } from "@/domain/ports";

export const NoaaWeatherProviderLive = Layer.succeed(WeatherProvider, {
  fetchRecentStorms: () => Effect.succeed([]),
});
