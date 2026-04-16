import { Effect, Layer } from "effect";

import { WeatherProvider } from "@/domain/ports";
import type { StormEvent } from "@/domain/entities";

/**
 * NWS Alerts Weather Provider
 *
 * Fetches active severe weather alerts from api.weather.gov and normalizes
 * them into StormEvent records. Focuses on alerts most relevant to storm
 * coverage monitoring:
 *   - Severe Thunderstorm Warning (hail + wind)
 *   - Tornado Warning
 *   - Severe Thunderstorm Watch (lower urgency)
 *
 * Challenges:
 *   - Alerts are zone-based (county/forecast zones), not point coordinates.
 *     We approximate lat/lng from state codes using rough state centroids.
 *   - Hail size and wind speed are sometimes embedded in free-text descriptions
 *     and need to be parsed with regex.
 */

const NWS_USER_AGENT = "storm-demo/0.1 (reuben local demo)";

const RELEVANT_EVENTS = new Set([
  "Severe Thunderstorm Warning",
  "Severe Thunderstorm Watch",
  "Tornado Warning",
  "Tornado Watch",
]);

// Rough US state centroids for lat/lng approximation when alerts are zone-based.
// This is a best-effort mapping; polygon-based matching would be more accurate.
const STATE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  AL: { lat: 32.806671, lng: -86.79113 },
  AR: { lat: 34.969704, lng: -92.373123 },
  AZ: { lat: 33.729759, lng: -111.431221 },
  CA: { lat: 36.116203, lng: -119.681564 },
  CO: { lat: 39.059811, lng: -105.311104 },
  CT: { lat: 41.597782, lng: -72.755371 },
  DE: { lat: 39.318523, lng: -75.507141 },
  FL: { lat: 27.766279, lng: -81.686783 },
  GA: { lat: 33.040619, lng: -83.643074 },
  IA: { lat: 42.011539, lng: -93.210526 },
  ID: { lat: 44.240459, lng: -114.478828 },
  IL: { lat: 40.349457, lng: -88.986137 },
  IN: { lat: 39.849426, lng: -86.258278 },
  KS: { lat: 38.5266, lng: -96.726486 },
  KY: { lat: 37.66814, lng: -84.670067 },
  LA: { lat: 31.169546, lng: -91.867805 },
  MA: { lat: 42.230171, lng: -71.530106 },
  MD: { lat: 39.063946, lng: -76.802101 },
  ME: { lat: 44.693947, lng: -69.381927 },
  MI: { lat: 43.326618, lng: -84.536095 },
  MN: { lat: 45.694454, lng: -93.900192 },
  MO: { lat: 38.456085, lng: -92.288368 },
  MS: { lat: 32.741646, lng: -89.678696 },
  MT: { lat: 46.921925, lng: -110.454353 },
  NC: { lat: 35.630066, lng: -79.806419 },
  ND: { lat: 47.528912, lng: -99.784012 },
  NE: { lat: 41.12537, lng: -98.268082 },
  NH: { lat: 43.452492, lng: -71.563896 },
  NJ: { lat: 40.298904, lng: -74.521011 },
  NM: { lat: 34.840515, lng: -106.248482 },
  NV: { lat: 38.313515, lng: -117.055374 },
  NY: { lat: 42.165726, lng: -74.948051 },
  OH: { lat: 40.388783, lng: -82.764915 },
  OK: { lat: 35.007752, lng: -97.092877 },
  OR: { lat: 44.572021, lng: -122.070938 },
  PA: { lat: 40.590752, lng: -77.209755 },
  RI: { lat: 41.680893, lng: -71.51178 },
  SC: { lat: 33.856892, lng: -80.945007 },
  SD: { lat: 44.299782, lng: -99.438828 },
  TN: { lat: 35.747845, lng: -86.692345 },
  TX: { lat: 31.054487, lng: -97.563461 },
  UT: { lat: 40.150032, lng: -111.862434 },
  VA: { lat: 37.769337, lng: -78.169968 },
  VT: { lat: 44.045876, lng: -72.710686 },
  WA: { lat: 47.400902, lng: -121.490494 },
  WI: { lat: 44.268543, lng: -89.616508 },
  WV: { lat: 38.491226, lng: -80.954453 },
  WY: { lat: 42.755966, lng: -107.30249 },
};

interface NwsAlertProperties {
  id: string;
  event: string;
  severity: string;
  certainty: string;
  urgency: string;
  onset: string | null;
  ends: string | null;
  effective: string | null;
  sent: string;
  senderName: string;
  headline: string | null;
  description: string | null;
  areaDesc: string;
  geocode: {
    SAME?: string[];
    UGC?: string[];
  };
}

interface NwsAlertFeature {
  id: string;
  properties: NwsAlertProperties;
}

interface NwsAlertResponse {
  features: NwsAlertFeature[];
}

/**
 * Try to extract a state code from the UGC zone codes (e.g., "TXZ001" -> "TX")
 * or from the areaDesc field.
 */
const extractStateFromAlert = (props: NwsAlertProperties): string => {
  const ugcCodes = props.geocode?.UGC ?? [];
  if (ugcCodes.length > 0) {
    const match = ugcCodes[0].match(/^([A-Z]{2})/);
    if (match) return match[1];
  }

  // Fallback: try to find a 2-letter state code in areaDesc
  for (const state of Object.keys(STATE_CENTROIDS)) {
    // Look for state abbreviation at word boundary in areaDesc
    if (new RegExp(`\\b${state}\\b`).test(props.areaDesc)) {
      return state;
    }
  }

  return "US";
};

/**
 * Parse hail size from alert description text.
 * Patterns like "quarter size hail", "1.75 inch hail", "ping pong ball size"
 */
const parseHailFromDescription = (description: string | null): number | null => {
  if (!description) return null;

  // Match patterns like "1.75 inch hail", "2 inch hail", "1.5" hail"
  const inchMatch = description.match(
    /(\d+(?:\.\d+)?)\s*(?:inch|in\.?|")\s*(?:diameter\s+)?hail/i,
  );
  if (inchMatch) return Number(inchMatch[1]);

  // Match named sizes
  const sizeMap: Record<string, number> = {
    "quarter": 1.0,
    "half dollar": 1.25,
    "ping pong": 1.5,
    "golf ball": 1.75,
    "tennis ball": 2.5,
    "baseball": 2.75,
    "softball": 4.0,
    "grapefruit": 4.0,
  };

  const lower = description.toLowerCase();
  for (const [name, size] of Object.entries(sizeMap)) {
    if (lower.includes(name)) return size;
  }

  return null;
};

/**
 * Parse wind speed from alert description text.
 * Patterns like "70 mph winds", "wind gusts up to 60 mph"
 */
const parseWindFromDescription = (description: string | null): number | null => {
  if (!description) return null;

  // "wind gusts up to 70 mph", "winds up to 60 mph", "70 mph wind"
  const gustMatch = description.match(
    /(?:wind\s*gusts?\s*(?:up\s*to|of|to)\s*|winds?\s*(?:up\s*to|of|to)\s*)(\d+)\s*mph/i,
  );
  if (gustMatch) return Number(gustMatch[1]);

  // "60 mph wind"
  const mphMatch = description.match(/(\d+)\s*mph\s*wind/i);
  if (mphMatch) return Number(mphMatch[1]);

  return null;
};

const severityFromNws = (
  nwsSeverity: string,
  hailSize: number | null,
  windSpeed: number | null,
): "light" | "moderate" | "severe" => {
  // If we have specific measurements, use those
  if (hailSize !== null) {
    if (hailSize >= 1.75) return "severe";
    if (hailSize >= 1.0) return "moderate";
    return "light";
  }

  if (windSpeed !== null) {
    if (windSpeed >= 70) return "severe";
    if (windSpeed >= 50) return "moderate";
    return "light";
  }

  // Fall back to NWS severity classification
  switch (nwsSeverity) {
    case "Extreme":
      return "severe";
    case "Severe":
      return "severe";
    case "Moderate":
      return "moderate";
    default:
      return "moderate";
  }
};

const determineEventType = (
  event: string,
  hailSize: number | null,
  windSpeed: number | null,
): "hail" | "wind" => {
  if (event.toLowerCase().includes("tornado")) return "wind";
  if (hailSize !== null && windSpeed === null) return "hail";
  if (windSpeed !== null && hailSize === null) return "wind";
  // Default: if description mentions both or neither, use hail for thunderstorm warnings
  return "hail";
};

const normalizeAlert = (feature: NwsAlertFeature): StormEvent | null => {
  const props = feature.properties;

  if (!RELEVANT_EVENTS.has(props.event)) return null;

  const state = extractStateFromAlert(props);
  const centroid = STATE_CENTROIDS[state];
  if (!centroid) return null;

  const hailSize = parseHailFromDescription(props.description);
  const windSpeed = parseWindFromDescription(props.description);
  const eventType = determineEventType(props.event, hailSize, windSpeed);
  const severity = severityFromNws(props.severity, hailSize, windSpeed);
  const occurredAt = props.onset ?? props.effective ?? props.sent;

  // Use the NWS alert URN as a stable source event ID
  const sourceEventId = `nws:${props.id}`;

  // Truncate areaDesc for city field
  const city = props.areaDesc.length > 60
    ? props.areaDesc.slice(0, 57) + "..."
    : props.areaDesc;

  return {
    id: crypto.randomUUID(),
    source: "nws-alerts",
    sourceEventId,
    eventType,
    occurredAt,
    lat: centroid.lat,
    lng: centroid.lng,
    city,
    region: state,
    severity,
    hailSize,
    windSpeed,
    createdAt: new Date().toISOString(),
  };
};

export const fetchNwsAlerts = () =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(
        "https://api.weather.gov/alerts/active?status=actual&message_type=alert,update",
        {
          headers: {
            "User-Agent": NWS_USER_AGENT,
            Accept: "application/geo+json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`NWS alerts API returned ${response.status}`);
      }

      const data = (await response.json()) as NwsAlertResponse;
      const storms = data.features
        .map(normalizeAlert)
        .filter((storm): storm is StormEvent => storm !== null);

      return storms;
    },
    catch: (error) => new Error(String(error)),
  }).pipe(
    Effect.catchAll((error) =>
      Effect.sync(() => {
        console.warn("[weather:nws] Failed to fetch NWS alerts", {
          error: error.message,
        });
        return [] as StormEvent[];
      }),
    ),
  );

export const NwsAlertsWeatherProviderLive = Layer.succeed(WeatherProvider, {
  fetchRecentStorms: fetchNwsAlerts,
});
