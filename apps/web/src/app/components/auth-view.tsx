import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import RadarRoundedIcon from "@mui/icons-material/RadarRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import type { FormEvent, SyntheticEvent } from "react";

import { MetricCard } from "@/app/components/metric-card";
import { useAuthStore } from "@/stores/auth-store";

export function AuthView() {
  const authMode = useAuthStore((s) => s.authMode);
  const setAuthMode = useAuthStore((s) => s.setAuthMode);
  const busy = useAuthStore((s) => s.busy);
  const error = useAuthStore((s) => s.error);
  const signup = useAuthStore((s) => s.signup);
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      if (authMode === "signup") {
        await signup({
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          companyName: String(form.get("companyName") ?? ""),
          contactName: String(form.get("contactName") ?? ""),
          phone: String(form.get("phone") ?? ""),
        });
      } else {
        await login({
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        });
      }
      event.currentTarget.reset();
    } catch {
      // Error is already set in the store
    }
  };

  return (
    <Box sx={{ minHeight: "100svh", py: { xs: 4, md: 8 } }}>
      <Container maxWidth="lg">
        <Grid alignItems="stretch" container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  p: { xs: 3, md: 5 },
                }}
              >
                <Box>
                  <Typography color="text.secondary" variant="overline">
                    Storm Coverage Monitor
                  </Typography>
                  <Typography sx={{ maxWidth: 560, mt: 1 }} variant="h1">
                    Hail and wind alerts for roofers, contractors, and regional
                    sales teams.
                  </Typography>
                </Box>

                <Typography
                  color="text.secondary"
                  sx={{ maxWidth: 560 }}
                  variant="body1"
                >
                  Define a coverage radius, visualize recent storms on the map,
                  and show a lightweight admin workflow for alerts. Use{" "}
                  <strong>admin@stormdemo.local</strong> during sign-up to
                  unlock the admin dashboard.
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <MetricCard
                      icon={<DashboardRoundedIcon />}
                      label="Portal"
                      value={1}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <MetricCard
                      icon={<RadarRoundedIcon />}
                      label="Storm feeds"
                      value={1}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <MetricCard
                      icon={<WarningAmberRoundedIcon />}
                      label="Alert flow"
                      value={1}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Tabs
                  onChange={(
                    _event: SyntheticEvent,
                    value: "login" | "signup",
                  ) => setAuthMode(value)}
                  sx={{ mb: 3 }}
                  value={authMode}
                >
                  <Tab label="Sign up" value="signup" />
                  <Tab label="Log in" value="login" />
                </Tabs>

                <Box
                  component="form"
                  onSubmit={(e: FormEvent<HTMLFormElement>) =>
                    void handleSubmit(e)
                  }
                >
                  <Stack spacing={2}>
                    {authMode === "signup" ? (
                      <>
                        <TextField
                          defaultValue="North Texas Roofing"
                          fullWidth
                          label="Company name"
                          name="companyName"
                          placeholder="North Texas Roofing"
                          required
                        />
                        <TextField
                          defaultValue="Alex Rivera"
                          fullWidth
                          label="Contact name"
                          name="contactName"
                          placeholder="Alex Rivera"
                          required
                        />
                        <TextField
                          defaultValue="(555) 555-5555"
                          fullWidth
                          label="Phone"
                          name="phone"
                          placeholder="(555) 555-5555"
                        />
                      </>
                    ) : null}

                    <TextField
                      defaultValue="admin@stormdemo.local"
                      fullWidth
                      label="Email"
                      name="email"
                      placeholder="admin@stormdemo.local"
                      required
                      type="email"
                    />
                    <TextField
                      defaultValue="password"
                      fullWidth
                      inputProps={{ minLength: 8 }}
                      label="Password"
                      name="password"
                      required
                      type="password"
                    />

                    {error ? <Alert severity="error">{error}</Alert> : null}

                    <Button
                      disabled={busy}
                      size="large"
                      type="submit"
                      variant="contained"
                    >
                      {busy
                        ? "Working..."
                        : authMode === "signup"
                          ? "Create account"
                          : "Log in"}
                    </Button>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
