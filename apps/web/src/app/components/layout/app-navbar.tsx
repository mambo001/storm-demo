import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";

import { useAdminStore } from "@/stores/admin-store";
import { useAuthStore } from "@/stores/auth-store";
import { useCoverageStore } from "@/stores/coverage-store";
import { useStormStore } from "@/stores/storm-store";

// Minutes until the next cron tick (every-30-min schedule: :00 and :30 UTC).
function useNextPullMinutes(): number {
  const calc = () => {
    const m = new Date().getUTCMinutes();
    const remaining = m < 30 ? 30 - m : 60 - m;
    return remaining;
  };
  const [mins, setMins] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setMins(calc()), 60_000);
    return () => clearInterval(id);
  }, []);
  return mins;
}

export function AppNavbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const user = useAuthStore((s) => s.user)!;
  const logout = useAuthStore((s) => s.logout);
  const adminBusy = useAdminStore((s) => s.busy);
  const ingest = useAdminStore((s) => s.ingest);
  const loadAdmin = useAdminStore((s) => s.load);
  const loadStorms = useStormStore((s) => s.load);
  const loadCoverage = useCoverageStore((s) => s.load);

  const nextPullMins = useNextPullMinutes();

  const handleIngest = async () => {
    await ingest();
    await Promise.all([loadStorms(), loadCoverage(), loadAdmin()]);
  };

  const handleLogout = async () => {
    await logout();
    useCoverageStore.getState().reset();
    useStormStore.getState().reset();
    useAdminStore.getState().reset();
  };

  return (
    <AppBar position="sticky">
      <Toolbar sx={{ gap: 2, justifyContent: "space-between" }}>
        <Box>
          <Typography color="text.secondary" variant="overline">
            {user.role === "admin" ? "Admin Dashboard" : "Client Portal"}
          </Typography>
          <Typography variant="h6">{user.companyName}</Typography>
        </Box>

        {isMobile ? (
          <>
            <IconButton
              color="inherit"
              edge="end"
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="right"
              onClose={() => setDrawerOpen(false)}
              open={drawerOpen}
            >
              <Box sx={{ width: 220, pt: 2 }}>
                <List>
                  {user.role === "admin" ? (
                    <ListItem disablePadding>
                      <ListItemButton
                        disabled={adminBusy}
                        onClick={() => {
                          setDrawerOpen(false);
                          void handleIngest();
                        }}
                      >
                        <ListItemText
                          primary="Pull storms"
                          secondary={`Auto-pull in ${nextPullMins} min`}
                        />
                      </ListItemButton>
                    </ListItem>
                  ) : null}
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => {
                        setDrawerOpen(false);
                        void handleLogout();
                      }}
                    >
                      <ListItemText primary="Log out" />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Box>
            </Drawer>
          </>
        ) : (
          <Stack alignItems="center" direction="row" spacing={1.5}>
            {user.role === "admin" ? (
              <>
                <Button
                  disabled={adminBusy}
                  onClick={() => void handleIngest()}
                  variant="contained"
                >
                  Pull storms
                </Button>
                <Typography color="text.secondary" variant="caption">
                  Auto-pull in {nextPullMins} min
                </Typography>
              </>
            ) : null}
            <Button onClick={() => void handleLogout()} variant="outlined">
              Log out
            </Button>
          </Stack>
        )}
      </Toolbar>
    </AppBar>
  );
}
