import { Schema } from "effect";

export const Severity = Schema.Literal("light", "moderate", "severe");
export type Severity = typeof Severity.Type;
