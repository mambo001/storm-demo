import { Context, Effect, ParseResult } from "effect";

import { StormEvent } from "@/domain/entities";
import { DatabaseError } from "@/domain/errors";

export interface StormEventRepository {
  readonly upsertMany: (
    storms: readonly StormEvent[],
  ) => Effect.Effect<void, DatabaseError | ParseResult.ParseError>;
  readonly listRecent: (
    sinceIso: string,
  ) => Effect.Effect<readonly StormEvent[], DatabaseError | ParseResult.ParseError>;
  readonly findById: (
    id: string,
  ) => Effect.Effect<StormEvent | null, DatabaseError | ParseResult.ParseError>;
}

export const StormEventRepository = Context.GenericTag<StormEventRepository>("StormEventRepository");
