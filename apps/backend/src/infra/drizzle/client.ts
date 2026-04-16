import { Context, Layer } from "effect";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";

import * as schema from "./schema";

export type Database = DrizzleD1Database<typeof schema>;

export const DatabaseTag = Context.GenericTag<Database>("Database");

export const makeDatabaseLayer = (d1: D1Database) =>
  Layer.succeed(DatabaseTag, drizzle(d1, { schema }));
