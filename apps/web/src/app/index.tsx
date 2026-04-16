import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import RadarRoundedIcon from "@mui/icons-material/RadarRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  Divider,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  ThemeProvider,
  Toolbar,
  Typography,
} from "@mui/material";
import { FormEvent, type SyntheticEvent, useEffect, useMemo, useState } from "react";

import { StormMap } from "@/app/components/storm-map";
import { appTheme } from "@/app/theme";
import { api, type AdminSummaryDto, type CoverageAreaDto, type StormDto, type UserDto } from "@/lib/api";

type AuthMode = "login" | "signup";

const emptyCoverageForm = {
  label: "Dallas coverage",
  centerLat: 32.7767,
  centerLng: -96.797,
  radiusMiles: 50,
  threshold: "moderate" as const,
};

const severityChipColor: Record<StormDto["severity"], "default" | "warning" | "error"> = {
  light: "default",
  moderate: "warning",
  severe: "error",
};

function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography color="text.secondary" variant="overline">
              {label}
            </Typography>
            <Typography variant="h2">{value}</Typography>
          </Box>
          <Paper
            sx={{
              alignItems: "center",
              bgcolor: "info.main",
              color: "primary.main",
              display: "inline-flex",
              height: 44,
              justifyContent: "center",
              width: 44,
            }}
          >
            {icon}
          </Paper>
        </Stack>
      </CardContent>
    </Card>
  );
}

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
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <Box sx={{ minHeight: "100svh", py: { xs: 4, md: 8 } }}>
          <Container maxWidth="lg">
            <Grid container spacing={3} alignItems="stretch">
              <Grid size={{ xs: 12, md: 7 }}>
                <Card sx={{ height: "100%" }}>
                  <CardContent sx={{ display: "flex", flexDirection: "column", gap: 3, p: { xs: 3, md: 5 } }}>
                    <Box>
                      <Typography color="text.secondary" variant="overline">
                        Storm Coverage Monitor
                      </Typography>
                      <Typography sx={{ maxWidth: 560, mt: 1 }} variant="h1">
                        Hail and wind alerts for roofers, contractors, and regional sales teams.
                      </Typography>
                    </Box>

                    <Typography color="text.secondary" sx={{ maxWidth: 560 }} variant="body1">
                      Define a coverage radius, visualize recent storms on the map, and show a lightweight admin workflow for alerts.
                      Use <strong>admin@stormdemo.local</strong> during sign-up to unlock the admin dashboard.
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <MetricCard icon={<DashboardRoundedIcon />} label="Portal" value={1} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <MetricCard icon={<RadarRoundedIcon />} label="Storm feeds" value={1} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <MetricCard icon={<WarningAmberRoundedIcon />} label="Alert flow" value={1} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <Card>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Tabs onChange={(_event: SyntheticEvent, value: AuthMode) => setAuthMode(value)} sx={{ mb: 3 }} value={authMode}>
                      <Tab label="Sign up" value="signup" />
                      <Tab label="Log in" value="login" />
                    </Tabs>

                    <Box component="form" onSubmit={handleAuthSubmit}>
                      <Stack spacing={2}>
                        {authMode === "signup" ? (
                          <>
                            <TextField fullWidth label="Company name" name="companyName" placeholder="North Texas Roofing" required />
                            <TextField fullWidth label="Contact name" name="contactName" placeholder="Alex Rivera" required />
                            <TextField fullWidth label="Phone" name="phone" placeholder="(555) 555-5555" />
                          </>
                        ) : null}

                        <TextField fullWidth label="Email" name="email" placeholder="admin@stormdemo.local" required type="email" />
                        <TextField fullWidth inputProps={{ minLength: 8 }} label="Password" name="password" required type="password" />

                        {error ? <Alert severity="error">{error}</Alert> : null}

                        <Button disabled={busy} size="large" type="submit" variant="contained">
                          {busy ? "Working..." : authMode === "signup" ? "Create account" : "Log in"}
                        </Button>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100svh" }}>
        <AppBar position="sticky">
          <Toolbar sx={{ gap: 2, justifyContent: "space-between" }}>
            <Box>
              <Typography color="text.secondary" variant="overline">
                {user.role === "admin" ? "Admin Dashboard" : "Client Portal"}
              </Typography>
              <Typography variant="h6">{user.companyName}</Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              {user.role === "admin" ? (
                <Button disabled={busy} onClick={handleIngest} variant="contained">
                  Pull demo storms
                </Button>
              ) : null}
              <Button onClick={handleLogout} variant="outlined">
                Log out
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Stack spacing={3}>
            <Box>
              <Typography color="text.secondary" variant="overline">
                Coverage Summary
              </Typography>
              <Typography variant="h1">{user.companyName}</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }} variant="body1">
                {user.contactName} · {user.email}
              </Typography>
            </Box>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 4 }}>
                <MetricCard icon={<RadarRoundedIcon />} label="Recent storms" value={storms.length} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <MetricCard icon={<WarningAmberRoundedIcon />} label="Within coverage" value={matchingStorms.length} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <MetricCard icon={<DashboardRoundedIcon />} label="Coverage zones" value={coverageAreas.length} />
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 5 }}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="h2">Coverage areas</Typography>
                        <Typography color="text.secondary" variant="body2">
                          Set the coverage radius you want to monitor for hail and wind events.
                        </Typography>
                      </Box>

                      <Box component="form" onSubmit={handleCoverageSubmit}>
                        <Stack spacing={2}>
                          <TextField
                            fullWidth
                            label="Label"
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setCoverageForm((current) => ({ ...current, label: event.target.value }))}
                            value={coverageForm.label}
                          />
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField
                                fullWidth
                                inputProps={{ step: 0.0001 }}
                                label="Latitude"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                  setCoverageForm((current) => ({ ...current, centerLat: Number(event.target.value) }))
                                }
                                type="number"
                                value={coverageForm.centerLat}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField
                                fullWidth
                                inputProps={{ step: 0.0001 }}
                                label="Longitude"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                  setCoverageForm((current) => ({ ...current, centerLng: Number(event.target.value) }))
                                }
                                type="number"
                                value={coverageForm.centerLng}
                              />
                            </Grid>
                          </Grid>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField
                                fullWidth
                                InputProps={{ endAdornment: <InputAdornment position="end">mi</InputAdornment> }}
                                inputProps={{ min: 1 }}
                                label="Radius"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                  setCoverageForm((current) => ({ ...current, radiusMiles: Number(event.target.value) }))
                                }
                                type="number"
                                value={coverageForm.radiusMiles}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField
                                fullWidth
                                label="Threshold"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                  setCoverageForm((current) => ({
                                    ...current,
                                    threshold: event.target.value as typeof current.threshold,
                                  }))
                                }
                                select
                                value={coverageForm.threshold}
                              >
                                <MenuItem value="light">Light</MenuItem>
                                <MenuItem value="moderate">Moderate</MenuItem>
                                <MenuItem value="severe">Severe</MenuItem>
                              </TextField>
                            </Grid>
                          </Grid>

                          <Button disabled={busy} type="submit" variant="contained">
                            Save coverage area
                          </Button>
                        </Stack>
                      </Box>

                      <Divider />

                      <Stack spacing={1.5}>
                        {coverageAreas.length === 0 ? (
                          <Typography color="text.secondary" variant="body2">
                            No coverage areas yet.
                          </Typography>
                        ) : null}
                        {coverageAreas.map((coverageArea) => (
                          <Paper key={coverageArea.id} sx={{ p: 2 }} variant="outlined">
                            <Stack direction="row" justifyContent="space-between" spacing={2}>
                              <Box>
                                <Typography variant="h3">{coverageArea.label}</Typography>
                                <Typography color="text.secondary" variant="body2">
                                  {coverageArea.centerLat.toFixed(3)}, {coverageArea.centerLng.toFixed(3)}
                                </Typography>
                              </Box>
                              <Chip color="primary" label={`${coverageArea.radiusMiles} mi`} variant="outlined" />
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, lg: 7 }}>
                <Card sx={{ mb: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="h2">Recent storm activity</Typography>
                        <Typography color="text.secondary" variant="body2">
                          Events inside your coverage are highlighted as matches.
                        </Typography>
                      </Box>

                      <Stack spacing={1.5}>
                        {storms.length === 0 ? (
                          <Typography color="text.secondary" variant="body2">
                            No storms loaded yet. {user.role === "admin" ? "Use Pull demo storms above." : "Ask an admin to ingest demo storms."}
                          </Typography>
                        ) : null}
                        {storms.map((storm) => (
                          <Paper key={storm.id} sx={{ p: 2 }} variant="outlined">
                            <Stack direction="row" justifyContent="space-between" spacing={2}>
                              <Box>
                                <Typography variant="h3">
                                  {storm.eventType.toUpperCase()} {storm.city}, {storm.region}
                                </Typography>
                                <Typography color="text.secondary" variant="body2">
                                  {new Date(storm.occurredAt).toLocaleString()}
                                </Typography>
                              </Box>
                              <Chip
                                color={storm.matchesCoverage ? "primary" : severityChipColor[storm.severity]}
                                label={storm.matchesCoverage ? "Match" : storm.severity}
                                variant={storm.matchesCoverage ? "filled" : "outlined"}
                              />
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography color="text.secondary" variant="overline">
                          Storm Map
                        </Typography>
                        <Typography variant="h2">Coverage overlap</Typography>
                      </Box>
                      <Box sx={{ borderRadius: 3, overflow: "hidden" }}>
                        <StormMap coverageAreas={coverageAreas} storms={storms} />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {user.role === "admin" && adminSummary ? (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 5 }}>
                  <Card>
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2.5}>
                        <Typography variant="h2">Admin metrics</Typography>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 6 }}>
                            <MetricCard icon={<DashboardRoundedIcon />} label="Clients" value={adminSummary.metrics.clients} />
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <MetricCard icon={<RadarRoundedIcon />} label="Coverage areas" value={adminSummary.metrics.coverageAreas} />
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <MetricCard icon={<WarningAmberRoundedIcon />} label="Storm records" value={adminSummary.metrics.recentStorms} />
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <MetricCard icon={<WarningAmberRoundedIcon />} label="Alerts" value={adminSummary.metrics.alerts} />
                          </Grid>
                        </Grid>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, lg: 7 }}>
                  <Card>
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2.5}>
                        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
                          <Box>
                            <Typography variant="h2">Manual alert</Typography>
                            <Typography color="text.secondary" variant="body2">
                              Sends a demo alert to the first registered user for the first storm in the feed.
                            </Typography>
                          </Box>
                          <Button
                            disabled={busy || !adminSummary.users[0] || !adminSummary.storms[0]}
                            onClick={handleSendTestAlert}
                            variant="contained"
                          >
                            Send test alert
                          </Button>
                        </Stack>

                        <Stack spacing={1.5}>
                          {adminSummary.alerts.length === 0 ? (
                            <Typography color="text.secondary" variant="body2">
                              No alerts yet.
                            </Typography>
                          ) : null}
                          {adminSummary.alerts.map((alert: AdminSummaryDto["alerts"][number]) => (
                            <Paper key={alert.id} sx={{ p: 2 }} variant="outlined">
                              <Stack direction="row" justifyContent="space-between" spacing={2}>
                                <Box>
                                  <Typography variant="h3">{alert.status}</Typography>
                                  <Typography color="text.secondary" variant="body2">
                                    {alert.message}
                                  </Typography>
                                </Box>
                                <Typography color="text.secondary" variant="body2">
                                  {new Date(alert.createdAt).toLocaleTimeString()}
                                </Typography>
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : null}
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
