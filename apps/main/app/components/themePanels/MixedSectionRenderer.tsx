// apps/main/components/theme-panel/MixedSectionRenderer.tsx

import { Typography, List, ListItem, ListItemText, ListItemIcon, Box } from "@repo/ui/mui"
import OpacityIcon from '@mui/icons-material/Opacity';
import { motion } from "@repo/motion";
import { useTheme } from "@repo/ui/mui";
import { fadeInRight } from "../../lib/constants/motionAnimations"
import type { MixedSection } from "../../../../../packages/data/src/coeqwal/themes.ts"


function parseBoldText(text: string): React.ReactNode {
    const parts = text.split(/\*\*(.*?)\*\*/g)
    return parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    )
}

export function MixedSectionRenderer({ content }: { content: MixedSection }) {
    const muiTheme = useTheme()

    return (
        <Box
            component={motion.div}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.3 }}
            variants={fadeInRight}
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: content.gap ?? "16px"
            }}
        >
            {content.blocks.map((block, i) => {
                switch (block.type) {
                    case "paragraph":
                        return (
                            <Typography
                                variant="body1"
                                key={i}
                            >
                                {parseBoldText(block.text)}
                            </Typography>
                        )
                    case "list":
                        return (
                            <List key={i}>
                                {block.items.map((item, j) => (
                                    <ListItem>
                                        <ListItemIcon
                                            sx={{
                                                color: muiTheme.palette.blue.darkest
                                            }}
                                        >
                                            <OpacityIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={parseBoldText(item)}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )
                    case "image":
                        return (
                            <figure key={i} style={{ margin: "70px", display: "flex", alignItems: "center", flexDirection: "column" }}>
                                <Box
                                    component={motion.img}
                                    initial="hidden"
                                    whileInView="show"
                                    viewport={{ once: false, amount: 0.3 }}
                                    variants={fadeInRight}
                                    src={block.src}
                                    alt={block.alt}
                                    sx={{
                                        width: "100%",
                                        maxWidth: "800px",
                                        margin: "0 auto",
                                        height: "auto",
                                    }}
                                />
                                {block.caption && (
                                    <figcaption style={{ marginTop: 8, fontSize: "0.85em" }}>
                                        {block.caption}
                                    </figcaption>
                                )}
                            </figure>
                        )
                    default: {
                        const _exhaustive: never = block
                        return null
                    }
                }
            })}
        </Box>
    )
} 