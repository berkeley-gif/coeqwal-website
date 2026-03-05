// apps/main/components/theme-panel/BoxSectionRenderer.tsx
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { motion } from "@repo/motion"
import { fadeInRight } from "../../lib/constants/motionAnimations"
import type { BoxSection } from "../../../../../packages/data/src/coeqwal/themes.ts"

export function BoxSectionRenderer({ content }: { content: BoxSection }) {
    const muiTheme = useTheme()
    return (
        <Box
            component="div"
            style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: muiTheme.borderRadius.md,
                gap: "70px",
            }}
        >
            {/* Box for a single item */}
            {content.items.map((item, i) => (
                <Box
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: false, amount: 0.3 }}
                    variants={fadeInRight}
                    component={motion.div}
                    key={i}
                    sx={{
                        display: "flex",
                        flexDirection: "row",
                        boxShadow: muiTheme.shadow.lg,
                        gap: muiTheme.space.gap.xl,
                        padding: "70px",
                        maxWidth: "900px"
                    }}
                >
                    <Typography
                        variant="h5"
                        sx={{
                            textTransform: "capitalize",
                        }}
                    >
                        {item.title}
                    </Typography>
                    <Box
                        component="div"
                        key={i}
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "30px"
                        }}
                    >
                        {item.paragraphs.map((p, j) => (
                            <Typography
                                key={j}
                                variant="body1"

                            >
                                {p}
                            </Typography>
                        ))}
                    </Box>
                </Box>

            ))}
        </Box>
    )
}