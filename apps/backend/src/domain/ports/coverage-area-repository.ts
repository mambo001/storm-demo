import { Context, Effect, ParseResult } from "effect";

import { CoverageArea } from "@/domain/entities";
import { DatabaseError } from "@/domain/errors";

export interface CoverageAreaRepository {
  readonly create: (
    coverageArea: CoverageArea,
  ) => Effect.Effect<void, DatabaseError | ParseResult.ParseError>;
  readonly listByUserId: (
    userId: string,
  ) => Effect.Effect<readonly CoverageArea[], DatabaseError | ParseResult.ParseError>;
  readonly listAll: () => Effect.Effect<readonly CoverageArea[], DatabaseError | ParseResult.ParseError>;
}

export const CoverageAreaRepository = Context.GenericTag<CoverageAreaRepository>("CoverageAreaRepository");
