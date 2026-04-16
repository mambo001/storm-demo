import { Effect, Schema } from "effect";

import { CoverageAreaRepository } from "@/domain/ports";

export const CreateCoverageAreaInput = Schema.Struct({
  label: Schema.String,
  centerLat: Schema.Number,
  centerLng: Schema.Number,
  radiusMiles: Schema.Number,
  threshold: Schema.Literal("light", "moderate", "severe"),
});

export type CreateCoverageAreaInput = typeof CreateCoverageAreaInput.Type;

export const createCoverageArea = (userId: string, input: CreateCoverageAreaInput) =>
  Effect.gen(function* () {
    const coverageAreaRepository = yield* CoverageAreaRepository;
    const coverageArea = {
      id: crypto.randomUUID(),
      userId,
      label: input.label,
      centerLat: input.centerLat,
      centerLng: input.centerLng,
      radiusMiles: input.radiusMiles,
      threshold: input.threshold,
      createdAt: new Date().toISOString(),
    } as const;

    yield* coverageAreaRepository.create(coverageArea);

    return coverageArea;
  });
