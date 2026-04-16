import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";

import type { StormDto } from "@/lib/api";
import { getSourceLabel, getSourceUrl } from "@/lib/source-url";
import { useAuthStore } from "@/stores/auth-store";
import { useStormStore } from "@/stores/storm-store";

const PAGE_SIZE = 10;

const severityChipColor: Record<
  StormDto["severity"],
  "default" | "warning" | "error"
> = {
  light: "default",
  moderate: "warning",
  severe: "error",
};

export function StormList() {
  const storms = useStormStore((s) => s.storms);
  const userRole = useAuthStore((s) => s.user?.role);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visibleStorms = storms.slice(0, visibleCount);
  const hasMore = storms.length > visibleCount;

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
                  ? "Use Pull storms above."
                  : "Ask an admin to ingest demo storms."}
              </Typography>
            ) : null}
            {visibleStorms.map((storm) => {
              const sourceUrl = getSourceUrl(storm.source, storm.sourceEventId);
              const sourceLabel = getSourceLabel(storm.source);

              return (
                <Paper key={storm.id} sx={{ p: 2 }} variant="outlined">
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Box>
                      <Typography variant="h3">
                        {storm.eventType.toUpperCase()} {storm.city},{" "}
                        {storm.region}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {new Date(storm.occurredAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Stack alignItems="flex-end" spacing={0.75}>
                      <Chip
                        color={
                          storm.matchesCoverage
                            ? "primary"
                            : severityChipColor[storm.severity]
                        }
                        label={storm.matchesCoverage ? "Match" : storm.severity}
                        variant={storm.matchesCoverage ? "filled" : "outlined"}
                      />
                      {sourceUrl ? (
                        <Chip
                          clickable
                          component="a"
                          href={sourceUrl}
                          icon={<LaunchRoundedIcon sx={{ fontSize: 14 }} />}
                          label={sourceLabel}
                          rel="noopener noreferrer"
                          size="small"
                          target="_blank"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          color="default"
                          label={sourceLabel}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>

          {storms.length > 0 ? (
            <Stack alignItems="center" spacing={1}>
              <Typography color="text.secondary" variant="body2">
                Showing {Math.min(visibleCount, storms.length)} of{" "}
                {storms.length} storms
              </Typography>
              {hasMore ? (
                <Button
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  size="small"
                  variant="outlined"
                >
                  Show more
                </Button>
              ) : null}
            </Stack>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
