"use client"

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useRouter } from "next/navigation"
import { WaterDroplet } from "@repo/ui"
import PanelShell from "./PanelShell"
import PanelHeading from "./PanelHeading"
import { LinedList } from "@repo/ui"
import { GlossaryTermLink } from "../../../glossary"
import { HYDROCLIMATE_DEFS } from "../../../../content/scenarios"

export default function HydroclimateFuturesPanel() {
  const theme = useTheme()
  const router = useRouter()
  const sp = theme.space.component
  const dropletIcon = <WaterDroplet />

  return (
    <PanelShell background={theme.palette.nature.forest}>
      <PanelHeading title="How are climate change impacts evaluated?" />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: sp.md,
          mb: sp.xl,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          <GlossaryTermLink>COEQWAL</GlossaryTermLink> makes it possible to look
          at how the outcomes of water{" "}
          <GlossaryTermLink term="Management strategies">
            management strategies
          </GlossaryTermLink>{" "}
          change with climate-driven shifts in temperature, precipitation, and
          river flows.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <GlossaryTermLink term="Hydroclimate">Hydroclimates</GlossaryTermLink>{" "}
          are simulations of historical and future conditions that represent
          different levels of stress to our water supply system. COEQWAL
          evaluates all management strategies under five hydroclimate,
          including:
        </Typography>
      </Box>

      <LinedList
        color={theme.palette.text.secondary}
        icon={dropletIcon}
        labelVariant="body2"
        sx={{ mt: sp.sm }}
        items={HYDROCLIMATE_DEFS.map((d) => ({
          label: `${d.label}: ${d.learnPanelDescription}`,
        }))}
      />

      <Typography variant="body2" color="text.secondary">
        NOTE:
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: sp.sm }}>
        The historical hydroclimate used in COEQWAL is adjusted for recent
        climate change and does not represent the observed historical record.
        The flow change reported for the four hydroclimate futures represent the
        average change in flow from California&#39;s major water supply basins
        over a 30-year period, centered on 2043. An assumed level of sea level
        rise is also specified for each hydroclimate future.{" "}
      </Typography>
      <Typography
        variant="body2"
        component="button"
        onClick={() => router.push("/data")}
        sx={{
          background: "none",
          border: "none",
          color: "text.secondary",
          cursor: "pointer",
          padding: 0,
          textAlign: "inherit" as const,
          mt: sp.sm,
        }}
      >
        Click here to learn more.
      </Typography>
    </PanelShell>
  )
}
