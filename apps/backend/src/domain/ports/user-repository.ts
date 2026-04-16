import { Context, Effect, ParseResult } from "effect";

import { User } from "@/domain/entities";
import {
  ConflictError,
  DatabaseError,
  NotFoundError,
} from "@/domain/errors";

export interface UserRepository {
  readonly create: (
    user: User,
  ) => Effect.Effect<void, ConflictError | DatabaseError | ParseResult.ParseError>;
  readonly findByEmail: (
    email: string,
  ) => Effect.Effect<User, NotFoundError | DatabaseError | ParseResult.ParseError>;
  readonly findById: (
    id: string,
  ) => Effect.Effect<User, NotFoundError | DatabaseError | ParseResult.ParseError>;
  readonly listAll: () => Effect.Effect<readonly User[], DatabaseError | ParseResult.ParseError>;
}

export const UserRepository = Context.GenericTag<UserRepository>("UserRepository");
