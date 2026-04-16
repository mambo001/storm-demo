import { Effect, Layer, Schema } from "effect";

import { CoverageArea } from "@/domain/entities";
import { DatabaseError } from "@/domain/errors";
import { CoverageAreaRepository } from "@/domain/ports";
import { D1DatabaseTag } from "@/shared/config";

interface CoverageAreaRow {
  id: string;
  user_id: string;
  label: string;
  center_lat: number;
  center_lng: number;
  radius_miles: number;
  threshold: "light" | "moderate" | "severe";
  created_at: string;
}

const toCoverageArea = (row: CoverageAreaRow) => ({
  id: row.id,
  userId: row.user_id,
  label: row.label,
  centerLat: row.center_lat,
  centerLng: row.center_lng,
  radiusMiles: row.radius_miles,
  threshold: row.threshold,
  createdAt: row.created_at,
});

export const D1CoverageAreaRepositoryLive = Layer.effect(
  CoverageAreaRepository,
  Effect.gen(function* () {
    const db = yield* D1DatabaseTag;

    const create = (coverageArea: CoverageArea) =>
      Effect.tryPromise({
        try: () =>
          db
            .prepare(
              "INSERT INTO coverage_areas (id, user_id, label, center_lat, center_lng, radius_miles, threshold, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(
              coverageArea.id,
              coverageArea.userId,
              coverageArea.label,
              coverageArea.centerLat,
              coverageArea.centerLng,
              coverageArea.radiusMiles,
              coverageArea.threshold,
              coverageArea.createdAt,
            )
            .run(),
        catch: (error) => new DatabaseError(String(error)),
      }).pipe(Effect.asVoid);

    const decodeRows = (rows: CoverageAreaRow[]) =>
      Schema.decodeUnknown(Schema.Array(CoverageArea))(rows.map(toCoverageArea));

    const listByUserId = (userId: string) =>
      Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: () =>
            db
              .prepare("SELECT * FROM coverage_areas WHERE user_id = ? ORDER BY created_at DESC")
              .bind(userId)
              .all(),
          catch: (error) => new DatabaseError(String(error)),
        });
        const rows = (result as D1Result<Record<string, unknown>>).results as unknown as CoverageAreaRow[];

        return yield* decodeRows(rows);
      });

    const listAll = () =>
      Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: () => db.prepare("SELECT * FROM coverage_areas ORDER BY created_at DESC").all(),
          catch: (error) => new DatabaseError(String(error)),
        });
        const rows = (result as D1Result<Record<string, unknown>>).results as unknown as CoverageAreaRow[];

        return yield* decodeRows(rows);
      });

    return CoverageAreaRepository.of({ create, listByUserId, listAll });
  }),
);
