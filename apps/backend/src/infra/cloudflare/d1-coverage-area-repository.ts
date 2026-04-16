import { desc, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";

import type { CoverageArea } from "@/domain/entities";
import { DatabaseError } from "@/domain/errors";
import { CoverageAreaRepository } from "@/domain/ports";
import { DatabaseTag } from "@/infra/drizzle/client";
import { coverageAreas } from "@/infra/drizzle/schema";

const toCoverageArea = (row: typeof coverageAreas.$inferSelect): CoverageArea => ({
  id: row.id,
  userId: row.userId,
  label: row.label,
  centerLat: row.centerLat,
  centerLng: row.centerLng,
  radiusMiles: row.radiusMiles,
  threshold: row.threshold,
  createdAt: row.createdAt,
});

export const D1CoverageAreaRepositoryLive = Layer.effect(
  CoverageAreaRepository,
  Effect.gen(function* () {
    const db = yield* DatabaseTag;

    const create = (coverageArea: CoverageArea) =>
      Effect.tryPromise({
        try: () =>
          db.insert(coverageAreas).values({
            id: coverageArea.id,
            userId: coverageArea.userId,
            label: coverageArea.label,
            centerLat: coverageArea.centerLat,
            centerLng: coverageArea.centerLng,
            radiusMiles: coverageArea.radiusMiles,
            threshold: coverageArea.threshold,
            createdAt: coverageArea.createdAt,
          }),
        catch: (error) => new DatabaseError(String(error)),
      }).pipe(Effect.asVoid);

    const listByUserId = (userId: string) =>
      Effect.tryPromise({
        try: async () => {
          const rows = await db
            .select()
            .from(coverageAreas)
            .where(eq(coverageAreas.userId, userId))
            .orderBy(desc(coverageAreas.createdAt));
          return rows.map(toCoverageArea);
        },
        catch: (error) => new DatabaseError(String(error)),
      });

    const listAll = () =>
      Effect.tryPromise({
        try: async () => {
          const rows = await db
            .select()
            .from(coverageAreas)
            .orderBy(desc(coverageAreas.createdAt));
          return rows.map(toCoverageArea);
        },
        catch: (error) => new DatabaseError(String(error)),
      });

    return CoverageAreaRepository.of({ create, listByUserId, listAll });
  }),
);
