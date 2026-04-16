import { Schema } from "effect";

import { Role } from "@/domain/value-objects";

export const User = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  passwordHash: Schema.String,
  companyName: Schema.String,
  contactName: Schema.String,
  phone: Schema.NullOr(Schema.String),
  role: Role,
  createdAt: Schema.String,
});

export type User = typeof User.Type;
