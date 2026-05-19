"use client"

import { Box, Typography, useTheme, alpha } from "@repo/ui/mui"
import { LinedList, WaterDroplet } from "@repo/ui"
import PanelShell from "./PanelShell"
import PanelHeading from "./PanelHeading"

/** Extra top margin applied ONLY to the Welcome panel (the first
 *  get-started panel). Provides clearance between the Explore tab's
 *  expandable description strip above the tabs stack and the Welcome
 *  card below it, so that when the strip collapses while scrolling
 *  the Welcome card can't be pulled up into the docked sticky bar */
const WELCOME_TOP_MARGIN_PX = 160

export default function WelcomePanel() {
  const theme = useTheme()
  const sp = theme.space.component
  const dropletIcon = <WaterDroplet />

  return (
    <Box sx={{ pt: `${WELCOME_TOP_MARGIN_PX}px` }}>
      <PanelShell background={theme.palette.tabPanels.exploreDeep}>
        <PanelHeading title="What is the COEQWAL scenario library and how should I use it?" />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            columnGap: theme.space.section.lg,
            rowGap: sp.lg,
          }}
        >
          {/* Column 1 - The model */}
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ opacity: 0.5, mb: sp.sm, display: "block" }}
            >
              The model
            </Typography>
            <Typography variant="body2" color="text.secondary">
              COEQWAL uses the{" "}
              <Typography component="span" variant="body2" fontWeight={600}>
                CalSim3
              </Typography>{" "}
              water planning model to evaluate how different{" "}
              <Typography component="span" variant="body2" fontWeight={600}>
                scenarios
              </Typography>{" "}
              affect outcomes for communities, farms, and the environment.
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: sp.md }}
            >
              Each scenario pairs a{" "}
              <Typography component="span" variant="body2" fontWeight={600}>
                water management strategy
              </Typography>{" "}
              (the operating rules, policies, and infrastructure decisions that
              determine how water is allocated) with a{" "}
              <Typography component="span" variant="body2" fontWeight={600}>
                hydroclimate
              </Typography>{" "}
              (the temperature and precipitation patterns that determine how
              much water is available).
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: sp.md }}
            >
              The management strategy represents what we can control and the
              hydroclimate represents what we can&rsquo;t control and must
              prepare for.
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
              COEQWAL has compiled a library of over 100 scenarios.
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: sp.md }}
            >
              Each scenario is associated with dozens of outcome variables that
              describe how water is allocated to different locations and users.
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
              A summary of all scenarios can be accessed{" "}
              <Typography
                component="button"
                variant="body2"
                sx={{
                  background: "none",
                  border: "none",
                  p: 0,
                  color: "text.secondary",
                  textDecoration: "underline",
                  textDecorationColor: alpha(theme.palette.common.white, 0.4),
                  textUnderlineOffset: "3px",
                  cursor: "pointer",
                  font: "inherit",
                  "&:hover": {
                    textDecorationColor: alpha(theme.palette.common.white, 0.8),
                  },
                }}
              >
                here
              </Typography>
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
              By exploring the scenario library, you will gain understanding of
              how:
            </Typography>
            <LinedList
              items={[
                {
                  label:
                    "Management strategies affect trade-offs and synergies among outcomes",
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
              arrows={false}
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
