import { Schema } from "effect";

export const Alert = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  stormEventId: Schema.String,
  channel: Schema.Literal("email"),
  status: Schema.Literal("queued", "sent", "failed"),
  message: Schema.String,
  createdAt: Schema.String,
});

export type Alert = typeof Alert.Type;
