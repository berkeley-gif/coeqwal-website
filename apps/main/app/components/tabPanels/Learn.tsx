'use client'

import { Box, Typography } from "@repo/ui/mui"
import CaliforniaMapPanel from "../../components/CaliforniaMapPanel"
import MapOverlayPanels from "../../components/MapOverlayPanels"
import ProgressiveScenarioPanels from "../../components/ProgressiveScenarioPanels"
import { CalSimProvider } from "../../components/CalSimContext"

import {
    LeadingMarkerText,
} from "@repo/ui"


export default function LearnPanel() {
    return (
        <div>
            <Box sx={{ pointerEvents: "none" }}>
                {/* CalSim context provider for shared state between map and overlays */}
                <CalSimProvider>
                    {/* Sticky California map background */}
                    <CaliforniaMapPanel id="california-map" />

                    {/* Scrolling overlay panels over the sticky map */}
                    <MapOverlayPanels />

                    {/* Progressive scenario and climate panels that appear on scroll */}
                    <ProgressiveScenarioPanels />
                </CalSimProvider>
            </Box>
            <Box
                id="learnMoreContainer"
                sx={{
                    display: "flex",
                    alignItems: { sm: "flex-start", md: "center" },
                    flexDirection: { sm: "column-reverse", lg: "row" },
                    gap: (theme) => theme.layout.spacing.md,
                    margin: '0 auto', 
                    maxWidth: '80%'
                }}
            >
                {/* Text column */}
                <Box sx={{ flex: 2, margin: '100px' }}>
                    <LeadingMarkerText title="Learn">
                        <Typography variant="body1" fontWeight={700}>
                            Do you know that California has one of the most complex water
                            allocation systems in the world?
                        </Typography>
                        <Typography variant="body1">
                            Learn how hydroclimate affects water availability, how water flows
                            through California&apos;s Central Valley, the ways in which we
                            manage water to satisfy diverse needs, and why inequities in water
                            access persist.
                        </Typography>
                        <Box
                            component="a"
                            href="https://flow.coeqwal.org/"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                color: (theme) => theme.palette.blue.darkest,
                                textDecoration: "none",
                                display: "block",
                                fontWeight: 500,
                                "&:hover": {
                                    textDecoration: "underline",
                                },
                            }}
                        >
                            Learn more: How water moves through California →
                        </Box>
                        <Box
                            component="a"
                            href="https://climate.coeqwal.org/"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                color: (theme) => theme.palette.blue.darkest,
                                textDecoration: "none",
                                display: "block",
                                mb: (theme) => theme.layout.spacing.xs,
                                fontWeight: 500,
                                "&:hover": {
                                    textDecoration: "underline",
                                },
                            }}
                        >
                            Learn more: Climate change and California water →
                        </Box>
                    </LeadingMarkerText>
                </Box>
                {/* Image column */}
                <Box
                    sx={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center" }}
                >
                    <Box
                        component="img"
                        src="/images/content/learn.png"
                        alt="Learn"
                        sx={{ width: "100%", maxWidth: 520, height: "auto" }}
                    />
                </Box>
            </Box>
        </div>
    )
}