import { MotionValue, motion } from "@repo/motion"
import "./bird.css"

function Bird({ opacity }: { opacity: MotionValue<number> }) {
  return (
    <>
      <motion.div
        className="bird-container bird-container--one"
        style={{ opacity }}
      >
        <div className="bird bird--one"></div>
      </motion.div>
      <motion.div
        className="bird-container bird-container--two"
        style={{ opacity }}
      >
        <div className="bird bird--two"></div>
      </motion.div>
      <motion.div
        className="bird-container bird-container--three"
        style={{ opacity }}
      >
        <div className="bird bird--three"></div>
      </motion.div>
      <motion.div
        className="bird-container bird-container--four"
        style={{ opacity }}
      >
        <div className="bird bird--four"></div>
      </motion.div>
      <motion.div
        className="bird-container bird-container--five"
        style={{ opacity }}
      >
        <div className="bird bird--five"></div>
      </motion.div>
      <motion.div
        className="bird-container bird-container--six"
        style={{ opacity }}
      >
        <div className="bird bird--six"></div>
      </motion.div>
    </>
  )
}

export default Bird
