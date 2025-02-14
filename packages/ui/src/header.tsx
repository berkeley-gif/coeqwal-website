"use client"; // because of useMediaQuery to determine button variant

import { AppBar, Toolbar, Typography, Button, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

export const useResponsiveButtonVariant = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return isMobile ? "text" : "outlined";
};

export function Header() {
  const buttonVariant = useResponsiveButtonVariant();

  return (
    <AppBar position="fixed" role="banner">
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography variant="h6">COEQWAL</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant={buttonVariant}
            sx={{
              border: buttonVariant === "text" ? "none" : undefined,
            }}
            aria-label="Switch Language"
          >
            EN | SP
          </Button>
          <Button
            variant={buttonVariant}
            sx={{
              border: buttonVariant === "text" ? "none" : undefined,
            }}
          >
            Get Data
          </Button>
          <Button
            variant={buttonVariant}
            sx={{
              border: buttonVariant === "text" ? "none" : undefined,
            }}
          >
            About COEQWAL
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
