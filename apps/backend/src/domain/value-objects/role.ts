import { Schema } from "effect";

export const Role = Schema.Literal("client", "admin");
export type Role = typeof Role.Type;
