/**
 * Construct a URL back to the original NOAA/NWS source for a storm event.
 * Returns null for demo/synthetic events.
 */
export function getSourceUrl(source: string, sourceEventId: string): string | null {
  if (source === "noaa-spc") {
    // sourceEventId format: "hail:2026-04-17:1430:TX:san-antonio:29.42:-98.49:175"
    const datePart = sourceEventId.split(":")[1]; // "2026-04-17"
    if (!datePart) return null;
    const [y, m, d] = datePart.split("-");
    if (!y || !m || !d) return null;
    return `https://www.spc.noaa.gov/climo/reports/${y.slice(2)}${m}${d}_rpts.html`;
  }

  if (source === "nws-alerts") {
    // sourceEventId format: "nws:urn:oid:2.49.0.1.840.0.xxxxx"
    const alertId = sourceEventId.replace(/^nws:/, "");
    return `https://api.weather.gov/alerts/${alertId}`;
  }

  return null;
}

export function getSourceLabel(source: string): string {
  if (source === "noaa-spc") return "SPC Report";
  if (source === "nws-alerts") return "NWS Alert";
  return "Demo";
}
