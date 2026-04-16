import { Schema } from "effect";

import { Severity } from "@/domain/value-objects";

export const StormEvent = Schema.Struct({
  id: Schema.String,
  source: Schema.String,
  sourceEventId: Schema.String,
  eventType: Schema.Literal("hail", "wind"),
  occurredAt: Schema.String,
  lat: Schema.Number,
  lng: Schema.Number,
  city: Schema.String,
  region: Schema.String,
  severity: Severity,
  hailSize: Schema.NullOr(Schema.Number),
  windSpeed: Schema.NullOr(Schema.Number),
  createdAt: Schema.String,
});

export type StormEvent = typeof StormEvent.Type;
