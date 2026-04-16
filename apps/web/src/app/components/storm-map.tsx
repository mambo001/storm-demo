import { MapContainer, TileLayer, Circle, CircleMarker, Popup } from "react-leaflet";

import type { CoverageAreaDto, StormDto } from "@/lib/api";

const severityColor: Record<StormDto["severity"], string> = {
  light: "#94a3b8",
  moderate: "#f59e0b",
  severe: "#dc2626",
};

const defaultCenter: [number, number] = [32.7767, -96.797];

interface StormMapProps {
  readonly coverageAreas: CoverageAreaDto[];
  readonly storms: StormDto[];
}

export function StormMap({ coverageAreas, storms }: StormMapProps) {
  const firstCoverageArea = coverageAreas[0];
  const center: [number, number] = firstCoverageArea
    ? [firstCoverageArea.centerLat, firstCoverageArea.centerLng]
    : defaultCenter;

  return (
    <MapContainer center={center} zoom={7} style={{ height: 420, width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {coverageAreas.map((coverageArea) => (
        <Circle
          key={coverageArea.id}
          center={[coverageArea.centerLat, coverageArea.centerLng]}
          radius={coverageArea.radiusMiles * 1609.34}
          pathOptions={{ color: "#2563eb", fillOpacity: 0.1 }}
        >
          <Popup>
            <strong>{coverageArea.label}</strong>
            <div>{coverageArea.radiusMiles} mile radius</div>
            <div>Threshold: {coverageArea.threshold}</div>
          </Popup>
        </Circle>
      ))}

      {storms.map((storm) => (
        <CircleMarker
          key={storm.id}
          center={[storm.lat, storm.lng]}
          radius={storm.matchesCoverage ? 10 : 7}
          pathOptions={{
            color: severityColor[storm.severity],
            fillColor: severityColor[storm.severity],
            fillOpacity: storm.matchesCoverage ? 0.9 : 0.6,
          }}
        >
          <Popup>
            <strong>
              {storm.eventType.toUpperCase()} {storm.city}, {storm.region}
            </strong>
            <div>Severity: {storm.severity}</div>
            <div>{new Date(storm.occurredAt).toLocaleString()}</div>
            {storm.hailSize ? <div>Hail: {storm.hailSize.toFixed(2)} in</div> : null}
            {storm.windSpeed ? <div>Wind: {storm.windSpeed} mph</div> : null}
            <div>{storm.matchesCoverage ? "Inside coverage" : "Outside coverage"}</div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
