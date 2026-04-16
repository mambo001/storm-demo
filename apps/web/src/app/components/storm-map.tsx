import { Circle, CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

import type { StormDto } from "@/lib/api";
import { getSourceLabel, getSourceUrl } from "@/lib/source-url";
import { useCoverageStore } from "@/stores/coverage-store";
import { useStormStore } from "@/stores/storm-store";

const severityColor: Record<StormDto["severity"], string> = {
  light: "#7d8b99",
  moderate: "#c68a2d",
  severe: "#c05a50",
};

const defaultCenter: [number, number] = [32.7767, -96.797];

export function StormMap() {
  const coverageAreas = useCoverageStore((s) => s.areas);
  const storms = useStormStore((s) => s.storms);

  const firstCoverageArea = coverageAreas[0];
  const center: [number, number] = firstCoverageArea
    ? [firstCoverageArea.centerLat, firstCoverageArea.centerLng]
    : defaultCenter;

  return (
    <MapContainer center={center} zoom={7} style={{ height: 440, width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {coverageAreas.map((coverageArea) => (
        <Circle
          key={coverageArea.id}
          center={[coverageArea.centerLat, coverageArea.centerLng]}
          radius={coverageArea.radiusMiles * 1609.34}
          pathOptions={{ color: "#355872", fillColor: "#9CD5FF", fillOpacity: 0.12, weight: 2 }}
        >
          <Popup>
            <strong>{coverageArea.label}</strong>
            <div>{coverageArea.radiusMiles} mile radius</div>
            <div>Threshold: {coverageArea.threshold}</div>
          </Popup>
        </Circle>
      ))}

      {storms.map((storm) => {
        const sourceUrl = getSourceUrl(storm.source, storm.sourceEventId);
        const sourceLabel = getSourceLabel(storm.source);

        return (
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
              {sourceUrl ? (
                <div>
                  <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                    {sourceLabel}
                  </a>
                </div>
              ) : null}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
