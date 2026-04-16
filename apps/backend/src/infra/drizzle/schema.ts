import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  phone: text("phone"),
  role: text("role", { enum: ["client", "admin"] }).notNull(),
  createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_sessions_token").on(table.token)],
);

export const coverageAreas = sqliteTable(
  "coverage_areas",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    centerLat: real("center_lat").notNull(),
    centerLng: real("center_lng").notNull(),
    radiusMiles: real("radius_miles").notNull(),
    threshold: text("threshold", { enum: ["light", "moderate", "severe"] }).notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_coverage_areas_user_id").on(table.userId)],
);

export const stormEvents = sqliteTable(
  "storm_events",
  {
    id: text("id").primaryKey(),
    source: text("source").notNull(),
    sourceEventId: text("source_event_id").notNull().unique(),
    eventType: text("event_type", { enum: ["hail", "wind"] }).notNull(),
    occurredAt: text("occurred_at").notNull(),
    lat: real("lat").notNull(),
    lng: real("lng").notNull(),
    city: text("city").notNull(),
    region: text("region").notNull(),
    severity: text("severity", { enum: ["light", "moderate", "severe"] }).notNull(),
    hailSize: real("hail_size"),
    windSpeed: real("wind_speed"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_storm_events_occurred_at").on(table.occurredAt)],
);

export const alerts = sqliteTable(
  "alerts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stormEventId: text("storm_event_id")
      .notNull()
      .references(() => stormEvents.id, { onDelete: "cascade" }),
    channel: text("channel", { enum: ["email"] }).notNull(),
    status: text("status", { enum: ["queued", "sent", "failed"] }).notNull(),
    message: text("message").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_alerts_user_id").on(table.userId)],
);
