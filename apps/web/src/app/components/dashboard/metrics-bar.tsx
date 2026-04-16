import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import RadarRoundedIcon from "@mui/icons-material/RadarRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Grid } from "@mui/material";

import { MetricCard } from "@/app/components/metric-card";
import { useCoverageStore } from "@/stores/coverage-store";
import { selectMatchingStorms, useStormStore } from "@/stores/storm-store";

export function MetricsBar() {
  const stormCount = useStormStore((s) => s.storms.length);
  const matchingCount = useStormStore(selectMatchingStorms).length;
  const areaCount = useCoverageStore((s) => s.areas.length);

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, md: 4 }}>
        <MetricCard icon={<RadarRoundedIcon />} label="Recent storms" value={stormCount} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <MetricCard icon={<WarningAmberRoundedIcon />} label="Within coverage" value={matchingCount} />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <MetricCard icon={<DashboardRoundedIcon />} label="Coverage zones" value={areaCount} />
      </Grid>
    </Grid>
  );
}
