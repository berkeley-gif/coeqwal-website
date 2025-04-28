"use client"

import { useRef, useEffect, useState } from "react"
import { useScroll, useTransform, useSpring } from "framer-motion"

type OffsetOptions = [
  (
    | "start center"
    | "end center"
    | `${number} ${number}`
    | `${number} start`
    | `${number} end`
    | `${number} center`
    | `${number} ${number}px`
    | `${number} ${number}vw`
    | `${number} ${number}vh`
    | `${number} ${number}%`
    | `start ${number}`
    | `end ${number}`
    | `center ${number}`
  ),
  (
    | "start center"
    | "end center"
    | `${number} ${number}`
    | `${number} start`
    | `${number} end`
    | `${number} center`
    | `${number} ${number}px`
    | `${number} ${number}vw`
    | `${number} ${number}vh`
    | `${number} ${number}%`
    | `start ${number}`
    | `end ${number}`
    | `center ${number}`
  ),
]

interface UseScrollOpacityOptions {
  completionThreshold?: number
  scrollOpacityRange?: [number, number]
  scrollOffset?: OffsetOptions
}

export const useScrollOpacity = (options: UseScrollOpacityOptions = {}) => {
  const {
    completionThreshold = 0.9,
    scrollOpacityRange = [0.3, 0.7],
    scrollOffset = ["start center", "end center"],
  } = options

  const sectionRef = useRef<HTMLDivElement>(null)
  const [isAnimationComplete, setIsAnimationComplete] = useState(false)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: scrollOffset,
  })

  const opacity = useTransform(scrollYProgress, scrollOpacityRange, [0, 1])

  const springOpacity = useSpring(opacity, { damping: 10, stiffness: 20 })

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      if (latest > completionThreshold && !isAnimationComplete) {
        setIsAnimationComplete(true)
      }
    })

    return () => unsubscribe()
  }, [scrollYProgress, isAnimationComplete, completionThreshold])

  return {
    sectionRef,
    isAnimationComplete,
    springOpacity,
  }
}

/* Example
function Opener() {
    const content = storyline.opener

    const { sectionRef, isAnimationComplete, springOpacity } = useScrollOpacity({
        completionThreshold: 0.9,
        scrollOpacityRange: [0.55, 0.7],
        scrollOffset: ["start center", "end center"]
    })
    
    return (
        <SectionContainer id="opener">
            <Box ref={sectionRef} className="container" height='100vh'>
                <Box sx={{ marginBottom: '5rem' }}>
                    <Typography variant='h1' gutterBottom>{content.title}</Typography>
                </Box>
                <MotionParagraph sx={{marginBottom: '10rem'}} variants={paragraphVariants}>
                    <Typography variant='body1'>{content.p1}</Typography>
                </MotionParagraph>
                <MotionParagraph className='paragraph' style={{ opacity: (isAnimationComplete) ? 1: springOpacity }}>
                    <Typography variant='body1' >{content.p4}</Typography>
                </MotionParagraph>
            </Box>
        </SectionContainer>
    )
}


*/
