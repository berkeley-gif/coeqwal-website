import React, { useState, useRef, useEffect } from "react"
import { Box, Fade } from "@mui/material"

export interface QuestionSvg {
  src: string
  xPercent: number // centre offset from panel centre, ‑50 ➜ far left, +50 ➜ far right
  yPercent: number
  width: number
  height: number
}

interface PhotoWithQuestionsProps {
  src: string
  questionSvgs: QuestionSvg[]
  transitionInterval?: number
}

/**
 * Renders a foreground photo (fills parent) with a sequence of question-SVGs
 * that are clamped so the entire SVG always stays inside the photo bounds.
 * Requires the parent to supply `position:relative` and `overflow:hidden`.
 */
export const PhotoWithQuestions: React.FC<PhotoWithQuestionsProps> = ({
  src,
  questionSvgs,
  transitionInterval = 4000,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  // measure wrapper
  useEffect(() => {
    if (!wrapperRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize({ w: width, h: height })
    })
    ro.observe(wrapperRef.current)
    return () => ro.disconnect()
  }, [])

  // cycle SVGs
  useEffect(() => {
    if (questionSvgs.length <= 1) return
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % questionSvgs.length)
        setVisible(true)
      }, 400)
    }, transitionInterval)
    return () => clearInterval(id)
  }, [questionSvgs.length, transitionInterval])

  const svg = questionSvgs[index]!
  const maxX = size.w ? 50 - (svg.width / 2 / size.w) * 100 : 50
  const maxY = size.h ? 50 - (svg.height / 2 / size.h) * 100 : 50
  const safeX = Math.max(-maxX, Math.min(svg.xPercent, maxX))
  const safeY = Math.max(-maxY, Math.min(svg.yPercent, maxY))
  const left = `calc(50% + ${safeX}%)`
  const top = `calc(50% + ${safeY}%)`

  // If no SVGs supplied, render just the photo
  if (questionSvgs.length === 0) {
    return (
      <Box sx={{ width: "100%", height: "100%" }}>
        <Box component="img" src={src} alt="hero foreground" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Box>
    )
  }

  return (
    <Box
      ref={wrapperRef}
      sx={{ position: "relative", width: "100%", height: "100%" }}
    >
      {/* foreground photo */}
      <Box
        component="img"
        src={src}
        alt="hero foreground"
        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* active SVG */}
      <Fade in={visible} timeout={500} key={index}>
        <Box
          component="img"
          src={svg.src}
          alt={`question ${index + 1}`}
          sx={{
            position: "absolute",
            left,
            top,
            width: svg.width,
            height: svg.height,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />
      </Fade>
    </Box>
  )
}
