import { Effect, Layer } from "effect";

import { WeatherProvider } from "@/domain/ports";

type EventType = "hail" | "wind";

interface SpcFeed {
  readonly url: string;
  readonly eventType: EventType;
  readonly dayOffset: number;
}

interface ParsedCsvRow {
  Time?: string;
  Size?: string;
  Speed?: string;
  Location?: string;
  County?: string;
  State?: string;
  Lat?: string;
  Lon?: string;
  Comments?: string;
}

const SPC_FEEDS: readonly SpcFeed[] = [
  {
    url: "https://www.spc.noaa.gov/climo/reports/today_hail.csv",
    eventType: "hail",
    dayOffset: 0,
  },
  {
    url: "https://www.spc.noaa.gov/climo/reports/today_wind.csv",
    eventType: "wind",
    dayOffset: 0,
  },
  {
    url: "https://www.spc.noaa.gov/climo/reports/yesterday_hail.csv",
    eventType: "hail",
    dayOffset: -1,
  },
  {
    url: "https://www.spc.noaa.gov/climo/reports/yesterday_wind.csv",
    eventType: "wind",
    dayOffset: -1,
  },
] as const;

const NOAA_USER_AGENT = "storm-demo/0.1 (reuben local demo)";

const severityFromHail = (hailSize: number) => {
  if (hailSize >= 1.75) {
    return "severe" as const;
  }

  if (hailSize >= 1.0) {
    return "moderate" as const;
  }

  return "light" as const;
};

const severityFromWind = (windSpeed: number | null) => {
  if (windSpeed === null) {
    return "moderate" as const;
  }

  if (windSpeed >= 70) {
    return "severe" as const;
  }

  if (windSpeed >= 50) {
    return "moderate" as const;
  }

  return "light" as const;
};

const padTime = (value: string) => value.trim().padStart(4, "0");

/**
 * SPC reporting "days" run from 1200 UTC to 1200 UTC. The times in the CSV
 * are in local time (approximately US Central: UTC-6 CST / UTC-5 CDT).
 *
 * We compute the SPC reporting date by finding the current 12Z boundary,
 * then applying the dayOffset. The HHMM time from the CSV is treated as
 * US Central time (we use UTC-5 as a reasonable year-round approximation
 * since severe weather season is primarily during CDT months).
 */
const US_CENTRAL_OFFSET_HOURS = -5; // CDT approximation

const getSpcReportingDate = (dayOffset: number): string => {
  const now = new Date();
  // SPC "today" starts at 1200 UTC. If we're before 12Z, "today" is actually
  // yesterday's reporting day.
  const currentUtcHour = now.getUTCHours();
  const spcDate = new Date(now);
  spcDate.setUTCHours(12, 0, 0, 0);
  if (currentUtcHour < 12) {
    spcDate.setUTCDate(spcDate.getUTCDate() - 1);
  }
  spcDate.setUTCDate(spcDate.getUTCDate() + dayOffset);

  const year = spcDate.getUTCFullYear();
  const month = String(spcDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(spcDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toIsoTimestamp = (dayOffset: number, time: string) => {
  const reportingDate = getSpcReportingDate(dayOffset);
  const paddedTime = padTime(time);
  const hours = Number(paddedTime.slice(0, 2));
  const minutes = Number(paddedTime.slice(2, 4));

  // Build the date in local Central time, then convert to UTC
  const [year, month, day] = reportingDate.split("-").map(Number);
  const localDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
  // Subtract the Central time offset to get UTC (offset is negative, so we subtract it)
  localDate.setUTCHours(localDate.getUTCHours() - US_CENTRAL_OFFSET_HOURS);

  return localDate.toISOString();
};

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      const nextCharacter = line[index + 1];
      if (insideQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (character === "," && !insideQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values.map((value) => value.trim());
};

const parseCsv = (csvText: string): readonly ParsedCsvRow[] => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const headerLine = lines[0];
  if (!headerLine) {
    return [];
  }

  const headers = parseCsvLine(headerLine);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce<ParsedCsvRow>((row, header, index) => {
      row[header as keyof ParsedCsvRow] = values[index] ?? "";
      return row;
    }, {});
  });
};

const toNumberOrNull = (value: string | undefined) => {
  if (!value || value === "UNK") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeState = (value: string | undefined) => value?.trim().toUpperCase() || "UNK";

const createSourceEventId = (
  eventType: EventType,
  dayOffset: number,
  row: ParsedCsvRow,
) => {
  const reportingDate = getSpcReportingDate(dayOffset);
  const parts = [
    eventType,
    reportingDate,
    row.Time?.trim() || "unknown-time",
    normalizeState(row.State),
    row.Location?.trim().toLowerCase().replace(/\s+/g, "-") || "unknown-location",
    row.Lat?.trim() || "unknown-lat",
    row.Lon?.trim() || "unknown-lon",
    row.Size?.trim() || row.Speed?.trim() || "unknown-magnitude",
  ];

  return parts.join(":");
};

const normalizeRow = (
  row: ParsedCsvRow,
  eventType: EventType,
  dayOffset: number,
) => {
  const time = row.Time?.trim();
  const latitude = toNumberOrNull(row.Lat);
  const longitude = toNumberOrNull(row.Lon);

  if (!time || latitude === null || longitude === null) {
    return null;
  }

  if (eventType === "hail") {
    const rawSize = toNumberOrNull(row.Size);
    const hailSize = rawSize === null ? null : rawSize / 100;

    return {
      id: crypto.randomUUID(),
      source: "noaa-spc",
      sourceEventId: createSourceEventId(eventType, dayOffset, row),
      eventType,
      occurredAt: toIsoTimestamp(dayOffset, time),
      lat: latitude,
      lng: longitude,
      city: row.Location?.trim() || row.County?.trim() || "Unknown",
      region: normalizeState(row.State),
      severity: severityFromHail(hailSize ?? 0),
      hailSize,
      windSpeed: null,
      createdAt: new Date().toISOString(),
    } as const;
  }

  const windSpeed = toNumberOrNull(row.Speed);

  return {
    id: crypto.randomUUID(),
    source: "noaa-spc",
    sourceEventId: createSourceEventId(eventType, dayOffset, row),
    eventType,
    occurredAt: toIsoTimestamp(dayOffset, time),
    lat: latitude,
    lng: longitude,
    city: row.Location?.trim() || row.County?.trim() || "Unknown",
    region: normalizeState(row.State),
    severity: severityFromWind(windSpeed),
    hailSize: null,
    windSpeed,
    createdAt: new Date().toISOString(),
  } as const;
};

const fetchFeed = ({ url, eventType, dayOffset }: SpcFeed) =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(url, {
        headers: {
          "User-Agent": NOAA_USER_AGENT,
          Accept: "text/csv,text/plain;q=0.9,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        throw new Error(`SPC feed request failed for ${url} with status ${response.status}`);
      }

      const csvText = await response.text();
      const rows = parseCsv(csvText);

      return rows
        .map((row) => normalizeRow(row, eventType, dayOffset))
        .filter((storm): storm is NonNullable<typeof storm> => storm !== null);
    },
    catch: (error) => new Error(String(error)),
  }).pipe(
    Effect.catchAll((error) =>
      Effect.sync(() => {
        console.warn("[weather:noaa] Failed to fetch SPC feed", {
          url,
          eventType,
          error: error.message,
        });
        return [] as const;
      }),
    ),
  );

const deduplicateStorms = <T extends { sourceEventId: string }>(storms: readonly T[]) => {
  const bySourceEventId = new Map<string, T>();

  for (const storm of storms) {
    if (!bySourceEventId.has(storm.sourceEventId)) {
      bySourceEventId.set(storm.sourceEventId, storm);
    }
  }

  return [...bySourceEventId.values()];
};

export const fetchSpcStorms = () =>
  Effect.gen(function* () {
    const stormGroups = yield* Effect.forEach(SPC_FEEDS, fetchFeed, {
      concurrency: "unbounded",
    });

    return deduplicateStorms(stormGroups.flat());
  });

export const NoaaWeatherProviderLive = Layer.succeed(WeatherProvider, {
  fetchRecentStorms: fetchSpcStorms,
});
