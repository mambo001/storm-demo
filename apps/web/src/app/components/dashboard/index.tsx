import {
  Alert,
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import { AdminPanel } from "@/app/components/dashboard/admin-panel";
import { CoveragePanel } from "@/app/components/dashboard/coverage-panel";
import { MetricsBar } from "@/app/components/dashboard/metrics-bar";
import { StormList } from "@/app/components/dashboard/storm-list";
import { AppNavbar } from "@/app/components/layout/app-navbar";
import { StormMap } from "@/app/components/storm-map";
import { useAuthStore } from "@/stores/auth-store";
import { useCoverageStore } from "@/stores/coverage-store";

export function Dashboard() {
  const user = useAuthStore((s) => s.user)!;
  const coverageError = useCoverageStore((s) => s.error);

  return (
    <Box sx={{ minHeight: "100svh" }}>
      <AppNavbar />

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

          {coverageError ? (
            <Alert severity="error">{coverageError}</Alert>
          ) : null}

          <MetricsBar />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 5 }}>
              <Stack spacing={2}>
                <Card sx={{ mt: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography color="text.secondary" variant="overline">
                          Storm Map
                        </Typography>
                        <Typography variant="h2">Coverage overlap</Typography>
                      </Box>
                      <Box sx={{ overflow: "hidden" }}>
                        <StormMap />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
                <CoveragePanel />
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, lg: 7 }}>
              <StormList />
            </Grid>
          </Grid>

          <AdminPanel />
        </Stack>
      </Container>
    </Box>
  );
}
