CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coverage_areas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  label TEXT NOT NULL,
  center_lat REAL NOT NULL,
  center_lng REAL NOT NULL,
  radius_miles REAL NOT NULL,
  threshold TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS storm_events (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  source_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  city TEXT NOT NULL,
  region TEXT NOT NULL,
  severity TEXT NOT NULL,
  hail_size REAL,
  wind_speed REAL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  storm_event_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (storm_event_id) REFERENCES storm_events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_coverage_areas_user_id ON coverage_areas(user_id);
CREATE INDEX IF NOT EXISTS idx_storm_events_occurred_at ON storm_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
