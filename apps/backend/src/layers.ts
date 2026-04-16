import { Layer } from "effect";

import {
  D1AlertRepositoryLive,
  D1CoverageAreaRepositoryLive,
  D1SessionRepositoryLive,
  D1StormEventRepositoryLive,
  D1UserRepositoryLive,
} from "@/infra/cloudflare";
import { makeDatabaseLayer } from "@/infra/drizzle/client";
import { PasswordHasherLive } from "@/infra/auth/password-hasher";
import { ConsoleMailerLive } from "@/infra/notifications/console-mailer";
import { DemoWeatherProviderLive } from "@/infra/weather/demo-weather-provider";
import { CombinedWeatherProviderLive } from "@/infra/weather/combined-weather-provider";
import { makeConfigLayer, type Env } from "@/shared/config";

export const makeAppLayer = (env: Env) => {
  const databaseLayer = makeDatabaseLayer(env.StormDemo);
  const configLayer = makeConfigLayer(env);
  const repositoryLayer = Layer.mergeAll(
    D1UserRepositoryLive,
    D1SessionRepositoryLive,
    D1CoverageAreaRepositoryLive,
    D1StormEventRepositoryLive,
    D1AlertRepositoryLive,
  ).pipe(Layer.provide(databaseLayer));
  const providerLayer = Layer.mergeAll(
    PasswordHasherLive,
    ConsoleMailerLive,
    env.WEATHER_MODE === "noaa" ? CombinedWeatherProviderLive : DemoWeatherProviderLive,
  );

  return Layer.mergeAll(repositoryLayer, providerLayer, configLayer);
};
