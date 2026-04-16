import { Schema } from "effect";

import { Severity } from "@/domain/value-objects";

export const CoverageArea = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  label: Schema.String,
  centerLat: Schema.Number,
  centerLng: Schema.Number,
  radiusMiles: Schema.Number,
  threshold: Severity,
  createdAt: Schema.String,
});

export type CoverageArea = typeof CoverageArea.Type;
