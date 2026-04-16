import { Layer } from "effect";

import {
  D1AlertRepositoryLive,
  D1CoverageAreaRepositoryLive,
  D1SessionRepositoryLive,
  D1StormEventRepositoryLive,
  D1UserRepositoryLive,
} from "@/infra/cloudflare";
import { PasswordHasherLive } from "@/infra/auth/password-hasher";
import { ConsoleMailerLive } from "@/infra/notifications/console-mailer";
import { DemoWeatherProviderLive } from "@/infra/weather/demo-weather-provider";
import { NoaaWeatherProviderLive } from "@/infra/weather/noaa-weather-provider";
import { makeConfigLayer, makeD1Layer, type Env } from "@/shared/config";

export const makeAppLayer = (env: Env) => {
  const d1Layer = makeD1Layer(env);
  const configLayer = makeConfigLayer(env);
  const repositoryLayer = Layer.mergeAll(
    D1UserRepositoryLive,
    D1SessionRepositoryLive,
    D1CoverageAreaRepositoryLive,
    D1StormEventRepositoryLive,
    D1AlertRepositoryLive,
  ).pipe(Layer.provide(d1Layer));
  const providerLayer = Layer.mergeAll(
    PasswordHasherLive,
    ConsoleMailerLive,
    env.WEATHER_MODE === "noaa" ? NoaaWeatherProviderLive : DemoWeatherProviderLive,
  );

  return Layer.mergeAll(repositoryLayer, providerLayer, configLayer);
};
