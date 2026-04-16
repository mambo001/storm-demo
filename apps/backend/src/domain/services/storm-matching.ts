import type { CoverageArea, StormEvent } from "@/domain/entities";
import type { Severity } from "@/domain/value-objects";

const severityRank: Record<Severity, number> = {
  light: 1,
  moderate: 2,
  severe: 3,
};

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const distanceMiles = (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
) => {
  const earthRadiusMiles = 3958.8;
  const latDelta = toRadians(endLat - startLat);
  const lngDelta = toRadians(endLng - startLng);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(toRadians(startLat)) *
      Math.cos(toRadians(endLat)) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMiles * c;
};

export const stormMatchesCoverageArea = (
  storm: StormEvent,
  coverageArea: CoverageArea,
) => {
  const miles = distanceMiles(
    storm.lat,
    storm.lng,
    coverageArea.centerLat,
    coverageArea.centerLng,
  );

  return (
    miles <= coverageArea.radiusMiles &&
    severityRank[storm.severity] >= severityRank[coverageArea.threshold]
  );
};
