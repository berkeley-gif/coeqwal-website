"use client"

import { Box, Typography, useTheme, Link } from "@repo/ui/mui"
import { LinedList, WaterDroplet } from "@repo/ui"
import { GlossaryTermLink } from "../../../glossary"
import PanelShell from "./PanelShell"
import PanelHeading from "./PanelHeading"

export default function WelcomePanel() {
  const theme = useTheme()
  const sp = theme.space.component
  const dropletIcon = <WaterDroplet />

  return (
    <Box>
      <PanelShell background={theme.palette.tabPanels.exploreDeep}>
        <PanelHeading title="What is COEQWAL?" />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            columnGap: theme.space.section.lg,
            rowGap: sp.lg,
          }}
        >
          {/* Column 1 - The model */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: sp.md,
            }}
          >
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ opacity: 0.5, display: "block" }}
            >
              COEQWAL Scenarios
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <GlossaryTermLink>COEQWAL</GlossaryTermLink> uses the{" "}
              <GlossaryTermLink>CalSim3</GlossaryTermLink> water planning model
              to evaluate how different{" "}
              <GlossaryTermLink term="Scenario">scenarios</GlossaryTermLink>{" "}
              affect outcomes for communities, farms, and the environment.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Each scenario pairs a water{" "}
              <GlossaryTermLink term="Management strategies">
                management strategy
              </GlossaryTermLink>{" "}
              (the operating rules, policies, and infrastructure decisions that
              determine how water is allocated) with a{" "}
              <GlossaryTermLink>hydroclimate</GlossaryTermLink> (the
              temperature, precipitation, and streamflow patterns that determine
              how much water is available).
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The{" "}
              <GlossaryTermLink term="Management strategies">
                management strategy
              </GlossaryTermLink>{" "}
              represents what we can control and the{" "}
              <GlossaryTermLink>hydroclimate</GlossaryTermLink> represents what
              we can&rsquo;t control and must prepare for.
            </Typography>
          </Box>

          {/* Column 2 - The library */}
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ opacity: 0.5, mb: sp.sm, display: "block" }}
            >
              The library
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <GlossaryTermLink>COEQWAL</GlossaryTermLink> has created a library
              of over 100{" "}
              <GlossaryTermLink term="Scenario">scenarios</GlossaryTermLink>.
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: sp.md }}
            >
              Each <GlossaryTermLink>scenario</GlossaryTermLink> is associated
              with dozens of outcome variables that describe how water is
              allocated to different locations and users.
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: sp.md }}
            >
              Visualization tools can be used to compare scenarios, examine
              outcomes, and interpret results across different perspectives.
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: sp.md }}
            >
              A summary of all{" "}
              <GlossaryTermLink term="Scenario">scenarios</GlossaryTermLink> can
              be accessed{" "}
              <Link
                href="/data"
                color="inherit"
                underline="always"
                sx={{
                  font: "inherit",
                  lineHeight: "inherit",
                }}
              >
                here
              </Link>
              .
            </Typography>
          </Box>

          {/* Column 3 - What you'll learn */}
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ opacity: 0.5, mb: sp.sm, display: "block" }}
            >
              What you&rsquo;ll learn
            </Typography>
            <Typography variant="body2" color="text.secondary">
              By exploring the <GlossaryTermLink>scenario</GlossaryTermLink>{" "}
              library, you will gain an understanding of how:
            </Typography>
            <LinedList
              items={[
                {
                  label: (
                    <>
                      <GlossaryTermLink term="Management strategy">
                        Management strategies
                      </GlossaryTermLink>{" "}
                      affect trade-offs and synergies among outcomes,
                    </>
                  ),
                },
                {
                  label:
                    "Benefits and impacts are distributed among water users and locations",
                },
                {
                  label:
                    "Different strategies perform under varying levels of climate stress",
                },
              ]}
              color={theme.palette.common.white}
              icon={dropletIcon}
              labelVariant="body2"
              sx={{ mt: sp.sm }}
            />
          </Box>
        </Box>
      </PanelShell>
    </Box>
  )
}
