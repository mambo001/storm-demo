import { Schema } from "effect";

export const Session = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  token: Schema.String,
  expiresAt: Schema.String,
  createdAt: Schema.String,
});

export type Session = typeof Session.Type;
