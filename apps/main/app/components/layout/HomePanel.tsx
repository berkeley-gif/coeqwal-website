import React from "react";
import { Grid2, Typography, Container, Box } from "@mui/material";
import Image from "next/image";

const HomePanel = () => {
  return (
    <Container>
      <Grid2 container spacing={{ xs: 2, lg: 16 }}>
        {/* Left side - Text content */}
        <Grid2 size={{ xs: 12, md: 6 }} order={{ xs: 2, md: 1 }}>
          <Typography
            variant="h1"
            sx={{
              whiteSpace: {
                xs: "normal",
                md: "pre-wrap",
              },
            }}
            gutterBottom
          >
            {`Californians 
are connected
by their water.`}
          </Typography>
          <Typography variant="body1">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </Typography>
        </Grid2>

        {/* Right side - Hero image */}
        <Grid2 size={{ xs: 12, md: 6 }} order={{ xs: 1, md: 2 }}>
          <Box
            sx={{
              width: {
                xs: "80%",
                md: "100%",
              },
              margin: "0 auto",
            }}
          >
            <Image
              src="/images/hero.png"
              alt="Illustration of people living in community in a California landscape with mountains, meadows, forests, and rivers"
              width={1893}
              height={1584}
              style={{
                width: "100%",
                height: "auto",
                objectFit: "contain",
                objectPosition: "center",
              }}
            />
          </Box>
        </Grid2>
      </Grid2>
    </Container>
  );
};

export default HomePanel;
