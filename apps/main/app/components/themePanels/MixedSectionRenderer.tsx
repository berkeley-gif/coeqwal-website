// apps/main/components/theme-panel/MixedSectionRenderer.tsx
import type { MixedSection } from "../../../../../packages/data/src/coeqwal/themes.ts"

function parseBoldText(text: string): React.ReactNode {
    const parts = text.split(/\*\*(.*?)\*\*/g)
    return parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    )
}

export function MixedSectionRenderer({ content }: { content: MixedSection }) {
    return (
        <div>
            {content.blocks.map((block, i) => {
                switch (block.type) {
                    case "paragraph":
                        return <p key={i}>{parseBoldText(block.text)}</p>
                    case "list":
                        return (
                            <ul key={i}>
                                {block.items.map((item, j) => (
                                    <li key={j}>{parseBoldText(item)}</li>
                                ))}
                            </ul>
                        )
                    case "image":
                        return (
                            <figure key={i} style={{ margin: "24px 0" }}>
                                <img
                                    src={block.src}
                                    alt={block.alt}
                                    style={{ width: "100%", maxWidth: "800px", borderRadius: 8 }}
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
        </div>
    )
} 