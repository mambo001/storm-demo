import { FormEvent, useEffect, useMemo, useState } from "react";

import { StormMap } from "@/app/components/storm-map";
import { api, type AdminSummaryDto, type CoverageAreaDto, type StormDto, type UserDto } from "@/lib/api";

type AuthMode = "login" | "signup";

const emptyCoverageForm = {
  label: "Dallas coverage",
  centerLat: 32.7767,
  centerLng: -96.797,
  radiusMiles: 50,
  threshold: "moderate" as const,
};

export function App() {
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [user, setUser] = useState<UserDto | null>(null);
  const [coverageAreas, setCoverageAreas] = useState<CoverageAreaDto[]>([]);
  const [storms, setStorms] = useState<StormDto[]>([]);
  const [adminSummary, setAdminSummary] = useState<AdminSummaryDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [coverageForm, setCoverageForm] = useState(emptyCoverageForm);

  const loadAuthenticatedData = async (nextUser?: UserDto | null) => {
    const [coverageResponse, stormsResponse] = await Promise.all([
      api.listCoverageAreas(),
      api.listStorms(),
    ]);
    setCoverageAreas(coverageResponse.coverageAreas);
    setStorms(stormsResponse.storms);

    const effectiveUser = nextUser ?? user;
    if (effectiveUser?.role === "admin") {
      setAdminSummary(await api.adminSummary());
    } else {
      setAdminSummary(null);
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        const response = await api.me();
        setUser(response.user);
        await loadAuthenticatedData(response.user);
      } catch {
        setUser(null);
      }
    })();
  }, []);

  const matchingStorms = useMemo(
    () => storms.filter((storm) => storm.matchesCoverage),
    [storms],
  );

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    try {
      const response =
        authMode === "signup"
          ? await api.signup({
              email: String(form.get("email") ?? ""),
              password: String(form.get("password") ?? ""),
              companyName: String(form.get("companyName") ?? ""),
              contactName: String(form.get("contactName") ?? ""),
              phone: String(form.get("phone") ?? ""),
            })
          : await api.login({
              email: String(form.get("email") ?? ""),
              password: String(form.get("password") ?? ""),
            });

      setUser(response.user);
      await loadAuthenticatedData(response.user);
      event.currentTarget.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  };

  const handleCoverageSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await api.createCoverageArea(coverageForm);
      setCoverageForm(emptyCoverageForm);
      await loadAuthenticatedData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save coverage area");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setCoverageAreas([]);
    setStorms([]);
    setAdminSummary(null);
  };

  const handleIngest = async () => {
    setBusy(true);
    setError(null);

    try {
      await api.ingestStorms();
      await loadAuthenticatedData();
    } catch (ingestError) {
      setError(ingestError instanceof Error ? ingestError.message : "Unable to ingest storms");
    } finally {
      setBusy(false);
    }
  };

  const handleSendTestAlert = async () => {
    if (!adminSummary?.users[0] || !adminSummary.storms[0]) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await api.sendTestAlert({
        userId: adminSummary.users[0].id,
        stormEventId: adminSummary.storms[0].id,
      });
      setAdminSummary(await api.adminSummary());
    } catch (alertError) {
      setError(alertError instanceof Error ? alertError.message : "Unable to send alert");
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <main className="shell auth-shell">
        <section className="panel hero-panel">
          <p className="eyebrow">Storm Coverage Monitor</p>
          <h1>Cloudflare-native hail and wind alert demo</h1>
          <p className="lede">
            Sign up as a client to define a coverage radius and see recent storms. Use
            <code> admin@stormdemo.local </code>
            to get the admin dashboard.
          </p>
        </section>

        <section className="panel auth-panel">
          <div className="auth-tabs">
            <button className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")} type="button">
              Sign up
            </button>
            <button className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")} type="button">
              Log in
            </button>
          </div>

          <form className="stack" onSubmit={handleAuthSubmit}>
            {authMode === "signup" ? (
              <>
                <label>
                  Company name
                  <input name="companyName" placeholder="North Texas Roofing" required />
                </label>
                <label>
                  Contact name
                  <input name="contactName" placeholder="Alex Rivera" required />
                </label>
                <label>
                  Phone
                  <input name="phone" placeholder="(555) 555-5555" />
                </label>
              </>
            ) : null}

            <label>
              Email
              <input name="email" placeholder="admin@stormdemo.local" required type="email" />
            </label>
            <label>
              Password
              <input minLength={8} name="password" required type="password" />
            </label>

            {error ? <p className="error-text">{error}</p> : null}

            <button disabled={busy} type="submit">
              {busy ? "Working..." : authMode === "signup" ? "Create account" : "Log in"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="shell app-shell">
      <header className="topbar panel">
        <div>
          <p className="eyebrow">{user.role === "admin" ? "Admin Dashboard" : "Client Portal"}</p>
          <h1>{user.companyName}</h1>
          <p className="lede">
            {user.contactName} · {user.email}
          </p>
        </div>

        <div className="actions">
          {user.role === "admin" ? (
            <button disabled={busy} onClick={handleIngest} type="button">
              Pull demo storms
            </button>
          ) : null}
          <button className="secondary" onClick={handleLogout} type="button">
            Log out
          </button>
        </div>
      </header>

      {error ? <p className="banner error-text">{error}</p> : null}

      <section className="grid two-up">
        <article className="panel">
          <h2>Coverage areas</h2>
          <form className="stack compact-form" onSubmit={handleCoverageSubmit}>
            <label>
              Label
              <input
                onChange={(event) => setCoverageForm((current) => ({ ...current, label: event.target.value }))}
                value={coverageForm.label}
              />
            </label>

            <div className="split">
              <label>
                Latitude
                <input
                  onChange={(event) =>
                    setCoverageForm((current) => ({ ...current, centerLat: Number(event.target.value) }))
                  }
                  step="0.0001"
                  type="number"
                  value={coverageForm.centerLat}
                />
              </label>
              <label>
                Longitude
                <input
                  onChange={(event) =>
                    setCoverageForm((current) => ({ ...current, centerLng: Number(event.target.value) }))
                  }
                  step="0.0001"
                  type="number"
                  value={coverageForm.centerLng}
                />
              </label>
            </div>

            <div className="split">
              <label>
                Radius (miles)
                <input
                  min="1"
                  onChange={(event) =>
                    setCoverageForm((current) => ({ ...current, radiusMiles: Number(event.target.value) }))
                  }
                  type="number"
                  value={coverageForm.radiusMiles}
                />
              </label>
              <label>
                Threshold
                <select
                  onChange={(event) =>
                    setCoverageForm((current) => ({
                      ...current,
                      threshold: event.target.value as typeof current.threshold,
                    }))
                  }
                  value={coverageForm.threshold}
                >
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </label>
            </div>

            <button disabled={busy} type="submit">
              Save coverage area
            </button>
          </form>

          <div className="list-block">
            {coverageAreas.length === 0 ? <p>No coverage areas yet.</p> : null}
            {coverageAreas.map((coverageArea) => (
              <div className="list-row" key={coverageArea.id}>
                <div>
                  <strong>{coverageArea.label}</strong>
                  <div>
                    {coverageArea.centerLat.toFixed(3)}, {coverageArea.centerLng.toFixed(3)}
                  </div>
                </div>
                <span>{coverageArea.radiusMiles} mi</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel stats-panel">
          <h2>Recent storm activity</h2>
          <div className="stats-grid">
            <div>
              <strong>{storms.length}</strong>
              <span>Recent storms</span>
            </div>
            <div>
              <strong>{matchingStorms.length}</strong>
              <span>Within coverage</span>
            </div>
            <div>
              <strong>{coverageAreas.length}</strong>
              <span>Coverage zones</span>
            </div>
          </div>

          <div className="list-block">
            {storms.length === 0 ? (
              <p>
                No storms loaded yet. {user.role === "admin" ? "Use Pull demo storms above." : "Ask an admin to ingest demo storms."}
              </p>
            ) : null}
            {storms.map((storm) => (
              <div className="list-row" key={storm.id}>
                <div>
                  <strong>
                    {storm.eventType.toUpperCase()} {storm.city}, {storm.region}
                  </strong>
                  <div>{new Date(storm.occurredAt).toLocaleString()}</div>
                </div>
                <span className={`pill ${storm.severity}`}>{storm.matchesCoverage ? "Match" : storm.severity}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel map-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Storm Map</p>
            <h2>Coverage overlap</h2>
          </div>
        </div>
        <StormMap coverageAreas={coverageAreas} storms={storms} />
      </section>

      {user.role === "admin" && adminSummary ? (
        <section className="grid two-up">
          <article className="panel">
            <h2>Admin metrics</h2>
            <div className="stats-grid">
              <div>
                <strong>{adminSummary.metrics.clients}</strong>
                <span>Clients</span>
              </div>
              <div>
                <strong>{adminSummary.metrics.coverageAreas}</strong>
                <span>Coverage areas</span>
              </div>
              <div>
                <strong>{adminSummary.metrics.recentStorms}</strong>
                <span>Storm records</span>
              </div>
              <div>
                <strong>{adminSummary.metrics.alerts}</strong>
                <span>Alerts sent</span>
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="section-heading">
              <h2>Manual alert</h2>
              <button disabled={busy || !adminSummary.users[0] || !adminSummary.storms[0]} onClick={handleSendTestAlert} type="button">
                Send test alert
              </button>
            </div>
            <p className="muted">
              Sends a demo alert to the first registered user for the first storm in the feed.
            </p>
            <div className="list-block">
              {adminSummary.alerts.length === 0 ? <p>No alerts yet.</p> : null}
              {adminSummary.alerts.map((alert: AdminSummaryDto["alerts"][number]) => (
                <div className="list-row" key={alert.id}>
                  <div>
                    <strong>{alert.status}</strong>
                    <div>{alert.message}</div>
                  </div>
                  <span>{new Date(alert.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}
    </main>
  );
}
