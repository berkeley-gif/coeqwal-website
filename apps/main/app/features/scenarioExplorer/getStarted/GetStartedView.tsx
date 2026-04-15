"use client"

import { useRef } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { ContentPanel } from "@repo/ui"
import { useMapMode } from "../../map/store"
import { usePanelRoute } from "../../../hooks/usePanelRoute"
import { useScenarioExplorerStore } from "../store"
import TierAnimationSection from "./TierAnimationSection"

const WATER_ISSUE_THEMES = [
  {
    title: "Community water systems",
    description:
      "Whether people and communities can reliably access safe drinking water for daily life, health, and essential services",
    themeKey: "cws",
  },
  {
    title: "Farms and groundwater",
    description:
      "Whether agricultural water deliveries can sustain food production, while preventing over-draft of groundwater basins",
    themeKey: "ag_gw",
  },
  {
    title: "Rivers, salmon and the Delta ecosystem",
    description:
      "Whether rivers, salmon, and the Delta estuary receive the flows they need to thrive",
    themeKey: "eco",
  },
  {
    title: "The Delta as a living place",
    description:
      "Whether the Delta is a place where communities, farms, and ecosystems coexist and thrive",
    themeKey: "delta",
  },
  {
    title: "Operations and impacts",
    description:
      "How management decisions affect trade-offs, equity and resilience",
    themeKey: "governance",
  },
] as const

const HYDROCLIMATES = [
  {
    title: "Historical hydroclimate (baseline)",
    description:
      "Temperature, precipitation, and streamflow patterns reflect historical conditions",
  },
  {
    title: "Moderate-dry climate risk",
    description:
      "Warmer and slightly drier conditions (\u22121% runoff change) — 50th percentile level of concern",
  },
  {
    title: "Moderate-wet climate risk",
    description:
      "Warmer and wetter conditions (+7% runoff change) — 44th percentile level of concern",
  },
  {
    title: "High climate risk",
    description:
      "Warmer and much drier conditions (\u22127% runoff change) — 95th percentile level of concern",
  },
  {
    title: "Extreme climate risk",
    description:
      "Much warmer and extremely drier conditions (\u221221% runoff change) — 99th percentile level of concern",
  },
] as const

const KEY_OUTCOMES = [
  {
    title: "Community water deliveries",
    description:
      "Reliability of water supplies to communities to satisfy essential drinking water needs",
  },
  {
    title: "Agricultural revenue",
    description:
      "Economic productivity of agricultural crops based on water availability",
  },
  {
    title: "Environmental flows",
    description:
      "Seasonal patterns of river flows needed to support healthy ecosystems",
  },
  {
    title: "Delta estuary ecology",
    description:
      "Seasonal patterns of flows needed to support the health of the Bay Delta estuary",
  },
  {
    title: "Winter-run salmon",
    description:
      "Population status of Sacramento River winter-run Chinook salmon",
  },
  {
    title: "Freshwater for in-Delta uses",
    description:
      "Availability of freshwater in the Delta to support local communities and farms",
  },
  {
    title: "Freshwater for Delta exports",
    description:
      "Availability of freshwater for export to other regions",
  },
  {
    title: "Reservoir storage",
    description: "Levels of water stored in major reservoirs",
  },
  {
    title: "Groundwater storage",
    description:
      "Amount and trends of water stored in groundwater basins",
  },
] as const

const CAVEATS = [
  "All scenarios are created by CalSim3, a water planning tool to guide operations of California\u2019s water supply system in the Central Valley.",
  "The scenarios do not include all regions of California nor certain aspects of our water system that may be of interest.",
  "Key outcomes summarize scenario results over a 100-year period. Annual variation in outcomes can be explored with the DATA IN DEPTH VIEW.",
  "The hydroclimates used in scenarios approximate the range of historical and potential future conditions that our system may experience. They do not represent historical observations or predicted future conditions according to climate models.",
  "Predictions of water deliveries to location of interest with small water demands are less reliable than predictions for water users that receive large water volumes.",
  "The outcomes of CalSim scenarios are best interpreted in a comparative manner \u2014 evaluating how outcomes change relative to current operations (as a baseline) is more appropriate than assessing the specific outcomes of any particular scenario.",
] as const

export default function GetStartedView() {
  const theme = useTheme()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const mapMode = useMapMode()
  const mapActive = mapMode === "get-started"
  const { openThemePanel } = usePanelRoute()
  const setMainView = useScenarioExplorerStore((s) => s.setMainView)

  const exploreBg = theme.palette.tabPanels.explore
  const sp = theme.space.component

  return (
    <Box
      ref={scrollContainerRef}
      sx={{
        position: "relative",
        pointerEvents: "none",
        backgroundColor: mapActive ? "transparent" : exploreBg,
      }}
    >
      {/* Welcome — custom layout (no ContentPanel) for full-width grid */}
      <Box
        sx={{
          pointerEvents: "auto",
          backgroundColor: mapActive
            ? theme.palette.tabPanels.exploreDeep
            : "transparent",
        }}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.tabPanels.exploreDeep,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: theme.space.panel.padding,
            py: theme.space.panel.padding,
          }}
        >
          {/* Heading */}
          <Typography
            variant="h3"
            component="h2"
            color="text.secondary"
            sx={{ maxWidth: "66%" }}
          >
            What is the COEQWAL scenario library
            <br />
            and how should I use it?
          </Typography>

          {/* Three-column grid */}
          <Box
            sx={{
              mt: theme.space.section.xl,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              columnGap: theme.space.section.lg,
              rowGap: sp.lg,
            }}
          >
            {/* Column 1 — The model */}
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
              <Typography variant="body2" color="text.secondary" sx={{ mt: sp.md }}>
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
              <Typography variant="body2" color="text.secondary" sx={{ mt: sp.md }}>
                The management strategy represents what we can control and the
                hydroclimate represents what we can&rsquo;t control and must
                prepare for.
              </Typography>
            </Box>

            {/* Column 2 — The library */}
            <Box>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ opacity: 0.5, mb: sp.sm, display: "block" }}
              >
                The library
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                COEQWAL has compiled a library of over 100 scenarios.
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={500}
                sx={{ mt: sp.md }}
              >
                Each scenario is associated with dozens of outcome variables that
                describe how water is allocated to different locations and users.
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={500}
                sx={{ mt: sp.md }}
              >
                Visualization tools can be used to compare scenarios, examine
                outcomes, and interpret results across different perspectives.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: sp.md }}>
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
                    textDecorationColor: "rgba(255,255,255,0.4)",
                    textUnderlineOffset: "3px",
                    cursor: "pointer",
                    font: "inherit",
                    "&:hover": {
                      textDecorationColor: "rgba(255,255,255,0.8)",
                    },
                  }}
                >
                  here
                </Typography>
                .
              </Typography>
            </Box>

            {/* Column 3 — What you'll learn */}
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
              <Box component="ul" sx={{ listStyle: "disc", pl: "1.25em", mt: sp.sm, color: "text.secondary" }}>
                {[
                  "Management strategies affect trade-offs and synergies among outcomes",
                  "Benefits and impacts are distributed among water users and locations",
                  "Different strategies perform under varying levels of climate stress",
                ].map((item) => (
                  <Box component="li" key={item} sx={{ mt: sp.sm }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight={500}
                    >
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Water Issues — custom layout for five-column grid */}
      <Box sx={{ pointerEvents: "auto" }}>
        <Box
          sx={{
            backgroundColor: theme.palette.blue.dark,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: theme.space.panel.padding,
            py: theme.space.panel.padding,
          }}
        >
          {/* Five-column grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              alignItems: "stretch",
              columnGap: theme.space.section.sm,
              rowGap: sp.lg,
            }}
          >
            {/* Heading — full width */}
            <Typography
              variant="h3"
              component="h2"
              color="text.secondary"
              sx={{ gridColumn: "1 / -1", maxWidth: "66%", mb: theme.space.section.md }}
            >
              What water issues interest you?
            </Typography>

            {/* Intro — full width, below the gap */}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ gridColumn: "1 / -1", maxWidth: "66%", mb: sp.lg }}
            >
              COEQWAL scenarios are designed to address key water challenges
              across California, including:
            </Typography>

            {/* Five issue columns */}
            {WATER_ISSUE_THEMES.map(({ title, description, themeKey }) => {
              const active = themeKey !== "cws" && themeKey !== "governance"
              return (
                <Box
                  key={themeKey}
                  component={active ? "button" : "div"}
                  onClick={active ? () => openThemePanel(themeKey) : undefined}
                  sx={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: theme.borderRadius.md,
                    p: sp.lg,
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    cursor: active ? "pointer" : "default",
                    transition: theme.transition.default,
                    ...(!active && { opacity: 0.45 }),
                    ...(active && {
                      "&:hover": {
                        background: "rgba(255,255,255,0.14)",
                        borderColor: "rgba(255,255,255,0.25)",
                      },
                    }),
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    {title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: sp.sm, opacity: 0.85 }}
                  >
                    {description}
                  </Typography>
                </Box>
              )
            })}

            {/* Footer CTA — full width */}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ gridColumn: "1 / -1", mt: sp.lg }}
            >
              Click on each water issue to learn more.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Hydroclimate Futures */}
      <Box sx={{ pointerEvents: "auto" }}>
        <Box
          sx={{
            backgroundColor: theme.palette.nature.forest,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: theme.space.panel.padding,
            py: theme.space.panel.padding,
          }}
        >
          <Typography
            variant="h3"
            component="h2"
            color="text.secondary"
            sx={{ maxWidth: "66%", mb: sp.sm }}
          >
            Hydroclimate futures
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: "66%", mb: theme.space.section.md, opacity: 0.85 }}
          >
            How are climate change impacts evaluated?
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              columnGap: theme.space.section.lg,
              rowGap: sp.lg,
              mb: theme.space.section.lg,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              COEQWAL evaluates how the outcomes of different water management
              strategies are affected by alternative hydroclimate futures. We
              specifically evaluate how the outcomes of water management
              strategies change with climate-driven shifts in water supplies and
              temperature.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The COEQWAL scenario library evaluates various hydroclimates that
              represent different levels of risk to the water supply system:
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              alignItems: "stretch",
              columnGap: theme.space.section.sm,
              rowGap: sp.lg,
            }}
          >
            {HYDROCLIMATES.map(({ title, description }, i) => {
              const dimmed = i === 2 || i === 4
              return (
              <Box
                key={title}
                sx={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: theme.borderRadius.md,
                  p: sp.lg,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  ...(dimmed && { opacity: 0.45 }),
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={600}
                >
                  {title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: sp.sm, opacity: 0.85 }}
                >
                  {description}
                </Typography>
              </Box>
              )
            })}
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: sp.lg }}
          >
            A summary of each hydroclimate future can be accessed{" "}
            <Typography
              component="button"
              variant="body2"
              sx={{
                background: "none",
                border: "none",
                p: 0,
                color: "text.secondary",
                textDecoration: "underline",
                textDecorationColor: "rgba(255,255,255,0.4)",
                textUnderlineOffset: "3px",
                cursor: "pointer",
                font: "inherit",
                "&:hover": {
                  textDecorationColor: "rgba(255,255,255,0.8)",
                },
              }}
            >
              here
            </Typography>
            .
          </Typography>
        </Box>
      </Box>

      {/* Key Outcomes */}
      <Box sx={{ pointerEvents: "auto" }}>
        <Box
          sx={{
            backgroundColor: exploreBg,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: theme.space.panel.padding,
            py: theme.space.panel.padding,
          }}
        >
          <Typography
            variant="h3"
            component="h2"
            color="text.secondary"
            sx={{ maxWidth: "66%", mb: sp.sm }}
          >
            Key Outcomes
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: "66%", mb: theme.space.section.md, opacity: 0.85 }}
          >
            How are scenario results described?
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: "50%", mb: theme.space.section.md }}
          >
            The results of each scenario are summarized by nine key outcomes:
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              alignItems: "stretch",
              columnGap: theme.space.section.sm,
              rowGap: theme.space.section.sm,
            }}
          >
            {KEY_OUTCOMES.map(({ title, description }) => (
              <Box
                key={title}
                sx={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: theme.borderRadius.md,
                  p: sp.lg,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={600}
                >
                  {title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: sp.sm, opacity: 0.85 }}
                >
                  {description}
                </Typography>
              </Box>
            ))}
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: sp.lg }}
          >
            A summary of all key outcomes can be accessed{" "}
            <Typography
              component="button"
              variant="body2"
              sx={{
                background: "none",
                border: "none",
                p: 0,
                color: "text.secondary",
                textDecoration: "underline",
                textDecorationColor: "rgba(255,255,255,0.4)",
                textUnderlineOffset: "3px",
                cursor: "pointer",
                font: "inherit",
                "&:hover": {
                  textDecorationColor: "rgba(255,255,255,0.8)",
                },
              }}
            >
              here
            </Typography>
            .
          </Typography>
        </Box>
      </Box>

      {/* Map panel (TierAnimationSection) */}
      <TierAnimationSection />

      {/* Tools */}
      <ContentPanel
        background={theme.palette.nature.forest}
        heading="Tools"
        sx={{ pointerEvents: "auto" }}
      >
        <Typography variant="body1" color="text.secondary" sx={{ mt: sp.lg }}>
          We have prepared a series of tools to help you understand, compare,
          and share data from the scenarios. You can find them in the Tools
          section of this Explore tab.
        </Typography>
        <Box component="ul" sx={{ listStyle: "none", p: 0, mt: sp.md }}>
          {["Bar chart", "Radar chart", "Distribution viewer"].map((tool) => (
            <Box component="li" key={tool} sx={{ mt: sp.sm }}>
              <Typography variant="body1" color="text.secondary">
                {tool}
              </Typography>
            </Box>
          ))}
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mt: sp.lg }}>
          You can go back and forth between the charts and a map.
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mt: sp.lg, fontStyle: "italic" }}
        >
          Coming soon: you can find locations you are interested in, and track
          them across the charts.
        </Typography>
      </ContentPanel>

      {/* Data in depth */}
      <ContentPanel
        background={exploreBg}
        heading="Data in depth"
        sx={{ pointerEvents: "auto" }}
      >
        <Typography variant="body1" color="text.secondary" sx={{ mt: sp.lg }}>
          In addition to the key outcomes, there are dozens of detailed scenario
          outcome variables that describe different features of the systems,
          including river flows, reservoir and groundwater storage, water
          deliveries, and Delta salinity.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: sp.lg }}>
          A full list of outcome variables can be accessed{" "}
          <Typography
            component="button"
            variant="body1"
            onClick={() => setMainView("data")}
            sx={{
              background: "none",
              border: "none",
              p: 0,
              color: "text.secondary",
              textDecoration: "underline",
              cursor: "pointer",
              font: "inherit",
            }}
          >
            here
          </Typography>
          .
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: sp.lg }}>
          Using the &ldquo;Data in Depth&rdquo; tool, users can generate
          summaries and plots of these different outcome variables to explore
          how they vary over space and time.
        </Typography>
      </ContentPanel>

      {/* Before you start your exploration */}
      <ContentPanel
        background={theme.palette.blue.dark}
        heading="Before you start your exploration"
        sx={{ pointerEvents: "auto" }}
      >
        <Typography variant="body1" color="text.secondary" sx={{ mt: sp.lg }}>
          There are a few important things to keep in mind:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mt: sp.md, color: "text.secondary" }}>
          {CAVEATS.map((caveat, i) => (
            <Box component="li" key={i} sx={{ mt: sp.sm }}>
              <Typography variant="body1" color="text.secondary">
                {caveat}
              </Typography>
            </Box>
          ))}
        </Box>
      </ContentPanel>
    </Box>
  )
}
