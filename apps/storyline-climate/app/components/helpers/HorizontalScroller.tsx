"use client"

import React, { useRef } from "react"
import { motion, useScroll, useTransform } from "@repo/motion"

//NOTE: implemented the horizontal scroll functionality

function HorizontalScroller() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    ["0vw", `-${(3 - 1) * 100}vw`],
  )

  return (
    <div style={{ backgroundColor: "#CBDF90" }}>
      <div
        style={{
          height: "10vh",
          backgroundColor: "#8FAD88",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Vertical Slider 1
      </div>

      <div
        ref={containerRef}
        className="img-group-container"
        style={{ height: "300vh", position: "relative" }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            overflow: "hidden",
            height: "100vh",
          }}
        >
          <motion.div
            className="img-group"
            style={{ x, width: "300vw", display: "flex" }}
          >
            {" "}
            {/* Adjust width based on content */}
            <div className="img-container" style={{ background: "lightblue" }}>
              Horizontal Item 1
            </div>
            <div className="img-container" style={{ background: "lightgreen" }}>
              Horizontal Item 2
            </div>
            <div className="img-container" style={{ background: "lightcoral" }}>
              Horizontal Item 3
            </div>
          </motion.div>
        </div>
      </div>

      <div
        style={{
          height: "10vh",
          backgroundColor: "#8FAD88",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Vertical Slider 1
      </div>
    </div>
  )
}

export default HorizontalScroller
