import { Context, Effect } from "effect";

import { StormEvent } from "@/domain/entities";

export interface WeatherProvider {
  readonly fetchRecentStorms: () => Effect.Effect<readonly StormEvent[], Error>;
}

export const WeatherProvider = Context.GenericTag<WeatherProvider>("WeatherProvider");
