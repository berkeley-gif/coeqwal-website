"use client"

import { ScrollElement, StickyScrollSection } from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"
import {
  appActions,
  useActiveSectionStore,
  useCentralValleyIcon,
  type CentralValleyIcon,
  useUrbanIcon,
  useWetlandIcon,
  useShowMapIconStrokes,
  useSalmonIcon,
  type UrbanIcon,
  type WetlandIcon,
  type SalmonIcon,
} from "../store"

const backgroundText = {
  title: { text: "How California's water flows" },
  opening: [
    { text: "California's water begins in mountain headwaters." },
    { text: "Water flows downstream through rivers toward the ocean." },
    {
      text: "Along the way, California's dams and reservoirs, canals and pumps disrupt this flow.",
    },
    { text: "They form a vast, complex network that distributes water to:" },
  ],
  reveals: [
    { text: "Agriculture for crops." },
    { text: "Cities and communities for drinking and commercial use." },
    {
      text: "Yet, rivers, wetlands, and fish need natural flows to function and thrive.",
    },
  ],
  closing: [
    {
      text: "For millions of years, Pacific salmon have migrated up California's rivers.",
    },
    {
      text: "The Sacramento and San Joaquin Rivers lead to cold headwaters where salmon spawn.",
    },
  ],
} as const

const centralValleyIconOptions: Array<{
  value: CentralValleyIcon
  label: string
}> = [
  { value: "/map-icons/ag/water-user-ag-01.svg", label: "Agriculture 01" },
  { value: "/map-icons/ag/water-user-ag-02.svg", label: "Agriculture 02" },
  { value: "/map-icons/ag/water-user-ag-03.svg", label: "Agriculture 03" },
  { value: "/map-icons/ag/water-user-ag-06.svg", label: "Agriculture 06" },
  { value: "/map-icons/ag/water-user-ag-08.svg", label: "Agriculture 08" },
]

const urbanIconOptions: Array<{ value: UrbanIcon; label: string }> = [
  { value: "/map-icons/urban/water_user_urban-01.svg", label: "Urban 01" },
  { value: "/map-icons/urban/water_user_urban-02.svg", label: "Urban 02" },
  { value: "/map-icons/urban/water_user_urban-03.svg", label: "Urban 03" },
]

const wetlandIconOptions: Array<{ value: WetlandIcon; label: string }> = [
  {
    value: "/map-icons/wetland/water_user_wetland-01.svg",
    label: "Wetland 01",
  },
  {
    value: "/map-icons/wetland/water_user_wetland-02.svg",
    label: "Wetland 02",
  },
  {
    value: "/map-icons/wetland/water_user_wetland-03.svg",
    label: "Wetland 03",
  },
]

const salmonIconOptions: Array<{ value: SalmonIcon; label: string }> = [
  { value: "/map-icons/salmon/salmon_adult.svg", label: "Salmon adult" },
  { value: "/map-icons/salmon/salmon_jump.svg", label: "Salmon jump" },
  { value: "/map-icons/salmon/salmon_juvenile.svg", label: "Salmon juvenile" },
  { value: "/map-icons/salmon/salmon_simple.svg", label: "Salmon simple" },
]

export default function Background() {
  return (
    <>
      <CentralValleyIconPreviewControl />
      <BackgroundNarrative />
    </>
  )
}

function BackgroundNarrative() {
  const revealStarts = [0.18, 0.32, 0.46] as const

  return (
    <StickyScrollSection
      id="frame-1"
      ariaLabel="California water system introduction"
      height="500vh"
      stickyTop="15vh"
      stickyHeight="70vh"
      offset={["start start", "end center"]}
    >
      <Box
        className="container text-section"
        sx={{
          maxWidth: "75ch",
          minHeight: "70vh",
          display: "grid",
          alignItems: "center",
        }}
      >
        <ScrollElement
          enter={[0, 0.04]}
          hold={[0.04, 0.68]}
          exit={[0.68, 0.72]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Box component="header">
            <SectionTitle text={backgroundText.title} />
          </Box>
          <Stack component="section" spacing={3.5}>
            <Box>
              <Paragraph blocks={backgroundText.opening} />
            </Box>
            <Stack spacing={1.25}>
              {backgroundText.reveals.map((sentence, index) => {
                const start = revealStarts[index]!

                return (
                  <ScrollElement
                    key={sentence.text}
                    enter={[start, start + 0.035]}
                    hold={[start + 0.035, 0.68]}
                    exit={[0.68, 0.72]}
                  >
                    <Paragraph blocks={[sentence]} />
                  </ScrollElement>
                )
              })}
            </Stack>
          </Stack>
        </ScrollElement>

        <ScrollElement
          enter={[0.72, 0.76]}
          hold={[0.76, 1]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Stack component="section" spacing={1.25}>
            <Paragraph blocks={backgroundText.closing} />
          </Stack>
        </ScrollElement>
      </Box>
    </StickyScrollSection>
  )
}

function CentralValleyIconPreviewControl() {
  const activeSection = useActiveSectionStore()
  const selectedIcon = useCentralValleyIcon()
  const urbanIcon = useUrbanIcon()
  const wetlandIcon = useWetlandIcon()
  const showMapIconStrokes = useShowMapIconStrokes()
  const salmonIcon = useSalmonIcon()

  if (activeSection !== "Background") return null

  return (
    <Box
      sx={{
        position: "fixed",
        left: "5rem",
        bottom: "1.5rem",
        zIndex: 4,
        width: "min(62rem, calc(100vw - 10rem))",
        padding: 1.25,
        borderRadius: 2,
        pointerEvents: "auto",
        color: "common.white",
        backgroundColor: "rgba(8, 16, 24, 0.82)",
        border: "1px solid rgba(255, 255, 255, 0.18)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 14px 36px rgba(0, 0, 0, 0.28)",
      }}
    >
      <Box
        component="label"
        htmlFor="central-valley-icon-preview"
        sx={{
          display: "block",
          marginBottom: 0.75,
          fontSize: "0.72rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          opacity: 0.76,
        }}
      >
        Map icon preview
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(9rem, 1fr))",
          gap: 1,
        }}
      >
        <IconPreviewSelect
          id="central-valley-icon-preview"
          label="Central Valley"
          value={selectedIcon}
          options={centralValleyIconOptions}
          onChange={(value) =>
            appActions.setCentralValleyIcon(value as CentralValleyIcon)
          }
        />
        <IconPreviewSelect
          id="urban-icon-preview"
          label="Bay Area + Los Angeles"
          value={urbanIcon}
          options={urbanIconOptions}
          onChange={(value) => appActions.setUrbanIcon(value as UrbanIcon)}
        />
        <IconPreviewSelect
          id="wetland-icon-preview"
          label="Delta"
          value={wetlandIcon}
          options={wetlandIconOptions}
          onChange={(value) => appActions.setWetlandIcon(value as WetlandIcon)}
        />
        <IconPreviewSelect
          id="salmon-icon-preview"
          label="Chinook Salmon"
          value={salmonIcon}
          options={salmonIconOptions}
          onChange={(value) => appActions.setSalmonIcon(value as SalmonIcon)}
        />
        <IconPreviewSelect
          id="map-icon-stroke-preview"
          label="Hand-drawn outlines"
          value={showMapIconStrokes ? "show" : "hide"}
          options={[
            { value: "show", label: "Show strokes" },
            { value: "hide", label: "Hide strokes" },
          ]}
          onChange={(value) =>
            appActions.setShowMapIconStrokes(value === "show")
          }
        />
      </Box>
    </Box>
  )
}

function IconPreviewSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: ReadonlyArray<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <Box>
      <Box
        component="label"
        htmlFor={id}
        sx={{ display: "block", marginBottom: 0.35, fontSize: "0.75rem" }}
      >
        {label}
      </Box>
      <Box
        id={id}
        component="select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        sx={{
          width: "100%",
          padding: "0.6rem 0.7rem",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          borderRadius: 1,
          color: "#172a48",
          backgroundColor: "#fcfbfa",
          font: "inherit",
          fontSize: "0.85rem",
          cursor: "pointer",
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Box>
    </Box>
  )
}
