import { Context, Effect } from "effect";

export interface PasswordHasher {
  readonly hash: (password: string) => Effect.Effect<string, Error>;
  readonly verify: (password: string, hash: string) => Effect.Effect<boolean, Error>;
}

export const PasswordHasher = Context.GenericTag<PasswordHasher>("PasswordHasher");
