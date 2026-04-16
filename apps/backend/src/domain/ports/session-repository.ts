import { Context, Effect, ParseResult } from "effect";

import { Session } from "@/domain/entities";
import { DatabaseError, NotFoundError } from "@/domain/errors";

export interface SessionRepository {
  readonly create: (
    session: Session,
  ) => Effect.Effect<void, DatabaseError | ParseResult.ParseError>;
  readonly findByToken: (
    token: string,
  ) => Effect.Effect<Session, NotFoundError | DatabaseError | ParseResult.ParseError>;
  readonly deleteByToken: (token: string) => Effect.Effect<void, DatabaseError>;
}

export const SessionRepository = Context.GenericTag<SessionRepository>("SessionRepository");
