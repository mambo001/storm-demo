import {
  Box,
  Card,
  CardContent,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import type { StormDto } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useStormStore } from "@/stores/storm-store";

const severityChipColor: Record<StormDto["severity"], "default" | "warning" | "error"> = {
  light: "default",
  moderate: "warning",
  severe: "error",
};

export function StormList() {
  const storms = useStormStore((s) => s.storms);
  const userRole = useAuthStore((s) => s.user?.role);

  return (
    <Card>
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
                No storms loaded yet.{" "}
                {userRole === "admin"
                  ? "Use Pull demo storms above."
                  : "Ask an admin to ingest demo storms."}
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
  );
}
