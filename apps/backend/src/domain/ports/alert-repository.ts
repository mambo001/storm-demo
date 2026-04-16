import { Context, Effect, ParseResult } from "effect";

import { Alert } from "@/domain/entities";
import { DatabaseError } from "@/domain/errors";

export interface AlertRepository {
  readonly create: (
    alert: Alert,
  ) => Effect.Effect<void, DatabaseError | ParseResult.ParseError>;
  readonly listRecent: () => Effect.Effect<readonly Alert[], DatabaseError | ParseResult.ParseError>;
}

export const AlertRepository = Context.GenericTag<AlertRepository>("AlertRepository");
