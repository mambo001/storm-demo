import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import RadarRoundedIcon from "@mui/icons-material/RadarRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { MetricCard } from "@/app/components/metric-card";
import { useAdminStore } from "@/stores/admin-store";
import { useAuthStore } from "@/stores/auth-store";
import { useCoverageStore } from "@/stores/coverage-store";
import { useStormStore } from "@/stores/storm-store";

export function AdminPanel() {
  const user = useAuthStore((s) => s.user);
  const summary = useAdminStore((s) => s.summary);
  const weatherDebug = useAdminStore((s) => s.weatherDebug);
  const busy = useAdminStore((s) => s.busy);
  const sendTestAlert = useAdminStore((s) => s.sendTestAlert);
  const loadAdmin = useAdminStore((s) => s.load);
  const loadStorms = useStormStore((s) => s.load);
  const loadCoverage = useCoverageStore((s) => s.load);

  if (user?.role !== "admin" || !summary) return null;

  const handleSendTestAlert = async () => {
    await sendTestAlert();
    await Promise.all([loadStorms(), loadCoverage(), loadAdmin()]);
  };

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 5 }}>
        <Stack spacing={3}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <Typography variant="h2">Admin metrics</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <MetricCard icon={<DashboardRoundedIcon />} label="Clients" value={summary.metrics.clients} />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <MetricCard icon={<RadarRoundedIcon />} label="Coverage areas" value={summary.metrics.coverageAreas} />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <MetricCard icon={<WarningAmberRoundedIcon />} label="Storm records" value={summary.metrics.recentStorms} />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <MetricCard icon={<WarningAmberRoundedIcon />} label="Alerts" value={summary.metrics.alerts} />
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>

          {weatherDebug ? (
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h2">Weather provider</Typography>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary" variant="body2">Mode</Typography>
                      <Chip
                        color={weatherDebug.weatherMode === "noaa" ? "primary" : "default"}
                        label={weatherDebug.weatherMode.toUpperCase()}
                        size="small"
                      />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary" variant="body2">Live feed total</Typography>
                      <Typography variant="body2">{weatherDebug.liveFeedCount}</Typography>
                    </Stack>
                    {weatherDebug.sources.spc > 0 ? (
                      <Stack direction="row" justifyContent="space-between" sx={{ pl: 1.5 }}>
                        <Typography color="text.secondary" variant="body2">SPC reports</Typography>
                        <Typography variant="body2">{weatherDebug.sources.spc}</Typography>
                      </Stack>
                    ) : null}
                    {weatherDebug.sources.nws > 0 ? (
                      <Stack direction="row" justifyContent="space-between" sx={{ pl: 1.5 }}>
                        <Typography color="text.secondary" variant="body2">NWS alerts</Typography>
                        <Typography variant="body2">{weatherDebug.sources.nws}</Typography>
                      </Stack>
                    ) : null}
                    {weatherDebug.sources.demo > 0 ? (
                      <Stack direction="row" justifyContent="space-between" sx={{ pl: 1.5 }}>
                        <Typography color="text.secondary" variant="body2">Demo seeds</Typography>
                        <Typography variant="body2">{weatherDebug.sources.demo}</Typography>
                      </Stack>
                    ) : null}
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary" variant="body2">DB recent (7d)</Typography>
                      <Typography variant="body2">{weatherDebug.dbRecentCount}</Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ) : null}
        </Stack>
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
                  disabled={busy || !summary.users[0] || !summary.storms[0]}
                  onClick={() => void handleSendTestAlert()}
                  variant="contained"
                >
                  Send test alert
                </Button>
              </Stack>

              <Stack spacing={1.5}>
                {summary.alerts.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">
                    No alerts yet.
                  </Typography>
                ) : null}
                {summary.alerts.map((alert) => (
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
  );
}
