// ResolutionScenario.tsx
import React from "react"
import { motion, type MotionValue } from "@repo/motion"
import { OffWhiteColor } from "../helpers/colorPalette"

const goldenColor = "#F1B143"

type Props = {
  firstScenario: MotionValue<number>
  secondScenario: MotionValue<number>
  restScenario: MotionValue<number>
  className?: string
  restOpacity?: number
}

export default function ResolutionScenario({
  firstScenario,
  secondScenario,
  restScenario,
}: Props) {
  return (
    <>
      <motion.text
        x={37}
        y={50}
        fill={OffWhiteColor}
        fontSize={22}
        fontWeight={500}
        style={{ opacity: secondScenario }}
      >
        <tspan x={37} dy="0em">
          COEQWAL also explores
        </tspan>
        <tspan x={37} dy="1.4em" fontWeight={700} textDecoration="underline">
          different strategies for managing water
        </tspan>
        <tspan x={37} dy="1.4em">
          and how these might limit the impacts of climate change.
        </tspan>
        <tspan x={37} dy="1.4em">
          These different approaches are grouped into distinct themes.
        </tspan>
      </motion.text>

      <motion.text
        x={947}
        y={63}
        fill={goldenColor}
        fontSize={26}
        style={{ opacity: secondScenario }}
      >
        Managing Groundwater in a Changing Agricultural Landscape
      </motion.text>

      <motion.text
        x={947}
        y={128}
        fill={OffWhiteColor}
        fontSize={22}
        style={{ opacity: secondScenario }}
      >
        <tspan x={947} dy="0em">
          For example, COEQWAL explores how reducing groundwater
        </tspan>
        <tspan x={947} dy="1.4em">
          pumping through SGMA can help during droughts, while also
        </tspan>
        <tspan x={947} dy="1.4em">
          considering the economic impacts to agricultural water users.
        </tspan>
      </motion.text>

      <motion.text
        x={947}
        y={265}
        fill={goldenColor}
        fontSize={26}
        style={{ opacity: secondScenario }}
      >
        Improving Reliability of Delta Exports for Farms and Cities
      </motion.text>

      <motion.text
        x={947}
        y={295}
        fill={OffWhiteColor}
        fontSize={22}
        style={{ opacity: secondScenario }}
      >
        <tspan x={947} dy="0em">
          COEQWAL explores scenarios provided by government{" "}
        </tspan>
        <tspan x={947} dy="1.4em">
          agencies that show how the Delta Conveyance Project
        </tspan>
        <tspan x={947} dy="1.4em">
          could change water exports and salinity in the Delta.{" "}
        </tspan>
      </motion.text>

      <motion.text
        x={947}
        y={485}
        fill={goldenColor}
        fontSize={26}
        style={{ opacity: secondScenario }}
      >
        Other scenario themes
      </motion.text>

      <motion.text
        x={810}
        y={60}
        fill={OffWhiteColor}
        fontSize={18}
        style={{ opacity: secondScenario }}
      >
        SGMA
      </motion.text>

      <motion.text
        x={850}
        y={310}
        fill={OffWhiteColor}
        fontSize={18}
        textAnchor="middle"
        style={{ opacity: secondScenario }}
      >
        <tspan x={850} dy="0em">
          Delta
        </tspan>
        <tspan x={850} dy="1.4em">
          Conveyance
        </tspan>
        <tspan x={850} dy="1.4em">
          Project
        </tspan>
      </motion.text>

      <motion.text
        x={660}
        y={280}
        fill={OffWhiteColor}
        fontSize={18}
        textAnchor="middle"
        style={{ opacity: secondScenario }}
      >
        <tspan x={660} dy="-0.7em">
          Reservoir
        </tspan>
        <tspan x={660} dy="1.4em">
          carryover
        </tspan>
      </motion.text>

      <motion.text
        x={615}
        y={470}
        fill={OffWhiteColor}
        fontSize={18}
        textAnchor="middle"
        style={{ opacity: secondScenario }}
      >
        <tspan x={615} dy="-0.7em">
          Ecosystem
        </tspan>
        <tspan x={615} dy="1.4em">
          needs
        </tspan>
      </motion.text>

      <motion.text
        x={1005}
        y={570}
        fill={OffWhiteColor}
        fontSize={18}
        textAnchor="middle"
        style={{ opacity: secondScenario }}
      >
        <tspan x={1005} dy="-0.7em">
          Community
        </tspan>
        <tspan x={1005} dy="1.4em">
          needs
        </tspan>
      </motion.text>

      <motion.text
        x={840}
        y={670}
        fill={OffWhiteColor}
        fontSize={18}
        textAnchor="middle"
        style={{ opacity: secondScenario }}
      >
        <tspan x={840} dy="-0.7em">
          Drought
        </tspan>
        <tspan x={840} dy="1.4em">
          Emergency
        </tspan>
      </motion.text>

      <motion.text
        x={1045}
        y={790}
        fill={OffWhiteColor}
        fontSize={18}
        textAnchor="middle"
        style={{ opacity: secondScenario }}
      >
        <tspan x={1045} dy="-0.7em">
          Delta
        </tspan>
        <tspan x={1045} dy="1.4em">
          Overflow
        </tspan>
      </motion.text>

      <motion.path
        d="M-8 201.78C5.5057 220.591 817 169.098 897 291.44C977 413.781 734 420.781 804 296.781C874 172.78 1702.31 233.579 1741 262.781"
        className="svg-line"
        pathLength={firstScenario}
      />
      <motion.path
        d="M-19 199.78C68.9324 230.037 931.5 161.78 887.5 46.2798C843.5 -69.2205 732 75.7804 816.5 92.7802C901 109.78 1741 78.7803 1741 78.7803"
        className="svg-line"
        pathLength={firstScenario}
      />
      <motion.path
        d="M-9 203.78C155.211 223.319 340.5 216.28 459 248.78C577.5 281.28 804 487.78 870 568.78C936 649.78 1148.9 759.945 1080 810.78C1011.1 861.616 976 788.78 1025 756.78C1074 724.78 1234.1 777.6 1371 829.78C1507.9 881.96 1737 881.78 1737 881.78"
        className="svg-line"
        style={{ opacity: 0.5 }}
        pathLength={restScenario}
      />
      <motion.path
        d="M-9 204.78C-9 204.78 220.13 127.578 543.814 336.996C867.499 546.415 472 532.78 571 434.78C670 336.78 834 556.78 993 636.78C1152 716.78 1753 850.78 1753 850.78"
        className="svg-line"
        style={{ opacity: 0.5 }}
        pathLength={restScenario}
      />
      <motion.path
        d="M-17 198.78C-17 198.78 331 357.78 453 257.78C575 157.78 696 457.78 767 500.78C838 543.78 960 691.78 849 704.78C738 717.78 776 601.78 878 630.78C980 659.78 1133 749.78 1274.5 781.576C1416 813.372 1759 869.78 1759 869.783"
        className="svg-line"
        style={{ opacity: 0.5 }}
        pathLength={restScenario}
      />
      <motion.path
        d="M0 203.78C0 203.78 353.223 295.268 491.09 299.08C594.811 301.948 715 471.78 808 511.78C901 551.78 968 631.759 1035 593.78C1102 555.801 1009 466.78 960 535.78C911 604.78 1061 667.78 1109 688.78C1157 709.78 1748 818.78 1748 818.78"
        className="svg-line"
        style={{ opacity: 0.5 }}
        pathLength={restScenario}
      />
      <motion.path
        d="M0.00262291 203.822C-9.92357 215.136 402.001 281.78 464 273.78C525.999 265.78 602.999 332.78 676.997 310.78C750.996 288.78 683.997 184.78 625.998 242.78C567.998 300.78 629.997 404.78 681.999 433.78C734 462.78 978.87 679.655 1128.43 709.565C1277.99 739.474 1766.99 911.78 1766.99 911.78"
        className="svg-line"
        style={{ opacity: 0.5 }}
        pathLength={restScenario}
      />
    </>
  )
}
