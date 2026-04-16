import {
  Box,
  Card,
  CardContent,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

interface MetricCardProps {
  readonly label: string;
  readonly value: number;
  readonly icon: ReactNode;
}

export function MetricCard({ label, value, icon }: MetricCardProps) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Stack
            flex={1}
            minHeight={{
              md: 100,
            }}
            justifyContent={"space-around"}
          >
            <Typography color="text.secondary" variant="overline">
              {label}
            </Typography>
            <Typography variant="h2">{value}</Typography>
          </Stack>
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
