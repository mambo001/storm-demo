import { ingestStormEvents } from "@/application/commands";
import { makeAppRuntime } from "@/app";
import type { Env } from "@/shared/config";

export const handleScheduled = async (env: Env) => {
  const runtime = makeAppRuntime(env);
  return runtime.runPromise(ingestStormEvents());
};
