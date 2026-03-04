// apps/main/components/theme-panel/BoxSectionRenderer.tsx
import type { BoxSection } from "../../../../../packages/data/src/coeqwal/themes.ts"

export function BoxSectionRenderer({ content }: { content: BoxSection }) {
    return (
        <div style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        }}>
            {content.items.map((item, i) => (
                <div key={i} style={{
                    padding: 24,
                    border: "1px solid",
                    borderRadius: 8,
                }}>
                    <h4 style={{ marginTop: 0 }}>{item.title}</h4>
                    {item.paragraphs.map((p, j) => (
                        <p key={j}>{p}</p>
                    ))}
                </div>
            ))}
        </div>
    )
}