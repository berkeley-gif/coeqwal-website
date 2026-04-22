"use client"

import { MotionValue, motion } from "@repo/motion"
import { Box } from "@repo/ui/mui"
import { HorizontalImageSlider } from "../helpers/ImageSlider"

type Props = {
  opacity: MotionValue<number>
  selectedMonth: number
}

const dryYearImages: string[] = [
  "/images/sierra_dry_year/2014-10-02.png",
  "/images/sierra_dry_year/2014-11-07.png",
  "/images/sierra_dry_year/2014-11-25.png",
  "/images/sierra_dry_year/2015-01-01.png",
  "/images/sierra_dry_year/2015-02-16.png",
  "/images/sierra_dry_year/2015-03-06.png",
  "/images/sierra_dry_year/2015-04-02.png",
  "/images/sierra_dry_year/2015-05-02.png",
  "/images/sierra_dry_year/2015-06-07.png",
  "/images/sierra_dry_year/2015-07-16.png",
  "/images/sierra_dry_year/2015-08-13.png",
  "/images/sierra_dry_year/2015-09-05.png",
]

const wetYearImages: string[] = [
  "/images/sierra_wet_year/2022-10-03.png",
  "/images/sierra_wet_year/2022-11-10.png",
  "/images/sierra_wet_year/2022-11-29.png",
  "/images/sierra_wet_year/2023-01-01.png",
  "/images/sierra_wet_year/2023-02-06.png",
  "/images/sierra_wet_year/2023-03-16.png",
  "/images/sierra_wet_year/2023-04-10.png",
  "/images/sierra_wet_year/2023-05-11.png",
  "/images/sierra_wet_year/2023-06-03.png",
  "/images/sierra_wet_year/2023-07-01.png",
  "/images/sierra_wet_year/2023-08-08.png",
  "/images/sierra_wet_year/2023-09-05.png",
]

export default function SierraNevadaImageScroller({
  opacity,
  selectedMonth,
}: Props) {
  const safeMonth = Math.min(11, Math.max(0, selectedMonth))
  const selectedDryImage = dryYearImages[safeMonth] || dryYearImages[0] || ""
  const selectedImage = wetYearImages[safeMonth] || wetYearImages[0] || ""

  return (
    <motion.div style={{ width: "100%", height: "100%", opacity }}>
      <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
        <HorizontalImageSlider
          leftSrc={selectedDryImage}
          rightSrc={selectedImage}
          width="100%"
          leftKnobLabel={"Dry Year \u2013 2015"}
          rightKnobLabel={"Wet Year \u2013 2023"}
        />
      </Box>
    </motion.div>
  )
}
