import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { ChangeEvent, FormEvent } from "react";

import { type CoverageFormState, useCoverageStore } from "@/stores/coverage-store";
import { useStormStore } from "@/stores/storm-store";

export function CoveragePanel() {
  const areas = useCoverageStore((s) => s.areas);
  const form = useCoverageStore((s) => s.form);
  const busy = useCoverageStore((s) => s.busy);
  const updateField = useCoverageStore((s) => s.updateField);
  const create = useCoverageStore((s) => s.create);
  const loadStorms = useStormStore((s) => s.load);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await create();
    // Re-match storms against new coverage
    await loadStorms();
  };

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h2">Coverage areas</Typography>
            <Typography color="text.secondary" variant="body2">
              Set the coverage radius you want to monitor for hail and wind events.
            </Typography>
          </Box>

          <Box component="form" onSubmit={(e: FormEvent<HTMLFormElement>) => void handleSubmit(e)}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Label"
                onChange={(event: ChangeEvent<HTMLInputElement>) => updateField("label", event.target.value)}
                value={form.label}
              />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    inputProps={{ step: 0.0001 }}
                    label="Latitude"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      updateField("centerLat", Number(event.target.value))
                    }
                    type="number"
                    value={form.centerLat}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    inputProps={{ step: 0.0001 }}
                    label="Longitude"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      updateField("centerLng", Number(event.target.value))
                    }
                    type="number"
                    value={form.centerLng}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    InputProps={{
                      endAdornment: <InputAdornment position="end">mi</InputAdornment>,
                    }}
                    inputProps={{ min: 1 }}
                    label="Radius"
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      updateField("radiusMiles", Number(event.target.value))
                    }
                    type="number"
                    value={form.radiusMiles}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Threshold"
                    onChange={(event) =>
                      updateField("threshold", event.target.value as CoverageFormState["threshold"])
                    }
                    select
                    value={form.threshold}
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
            {areas.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                No coverage areas yet.
              </Typography>
            ) : null}
            {areas.map((coverageArea) => (
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
  );
}
