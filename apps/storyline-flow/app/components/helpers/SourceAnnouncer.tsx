import { motion } from "@repo/motion"
import { Box, Typography } from "@repo/ui/mui"
import useStoryStore from "../../store"

const MotionBox = motion.create(Box)

export default function SourceAnnouncer() {
  const activeSection = useStoryStore((state) => state.activeSection)
  const sectionsToShowSource = [
    "precipitation",
    "snowpack",
    "flow",
    "wetland",
    "city",
    "agriculture",
    "economy",
  ]

  return (
    <MotionBox
      id="source-container"
      initial={{ opacity: 0 }}
      animate={{
        opacity: sectionsToShowSource.includes(activeSection) ? 1 : 0,
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {activeSection === "precipitation" && (
        <>
          <Typography variant="caption" className="source">
            Data source:
          </Typography>
          <Typography variant="caption" className="source">
            30-year normals from{" "}
            <a
              href="https://prism.oregonstate.edu/normals/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              PRISM
            </a>
            .
          </Typography>
        </>
      )}
      {activeSection === "snowpack" && (
        <>
          <Typography variant="caption" className="source">
            Data source:
          </Typography>
          <Typography variant="caption" className="source">
            Snowpack accumulation processed from{" "}
            <a
              href="https://www.nohrsc.noaa.gov/snowfall/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              NOAA
            </a>
            .
          </Typography>
        </>
      )}
    </MotionBox>
  )
}
