import React, { useEffect, useRef, useState } from "react"
import { WaterNeedSetting } from "./types"
import { WATER_NEED_TYPES, DEFAULT_OTHER_WATER_NEEDS } from "./constants"
import {
  Box,
  Chip,
  Button,
  AddIcon,
  IconButton,
  CloseIcon,
  EditIcon,
  CheckIcon,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@repo/ui/mui"
import { getTitleText, getRuleText } from "./utils"
import Matter from "matter-js"

type NeedsBucketWaterNeedSetting = WaterNeedSetting & {
  isUserDefined: boolean
  isSelected: boolean
  isSatisfiable: boolean
}

interface BucketSceneProps {
  height?: number
  width?: number
  needsList: WaterNeedSetting[]
  editWaterNeed: (idx: number) => void
  finishWaterNeed: (finalSelectedNeeds: NeedsBucketWaterNeedSetting[]) => void
}

const getLabel = (need: NeedsBucketWaterNeedSetting) => {
  const currentWaterNeedType = WATER_NEED_TYPES.find(
    (item) => item.label === need.name,
  )
  if (!currentWaterNeedType) {
    return "No title available"
  }
  return `${need.isUserDefined ? "Your" : "Person ABC's"} ${need.name} need over ${need.setting.title["Region"]?.value}`
}

const determineIfSatisfiable = () =>
  // need: NeedsBucketWaterNeedSetting,
  // allNeeds: NeedsBucketWaterNeedSetting[],
  {
    // Just a placeholder function to determine if a need is satisfiable
    // In a real application, this would contain logic to check if the need can be satisfied so return randomly
    return Math.random() > 0.5
  }

const BucketScene = ({
  height = 800,
  width = 800,
  needsList,
  editWaterNeed,
  finishWaterNeed,
}: BucketSceneProps) => {
  const sceneRef = useRef(null)
  const ballsRef = useRef<Matter.Body[]>([])
  const engineRef = useRef(Matter.Engine.create())
  const containerRef = useRef<HTMLDivElement>(null)

  // const [balls, setBalls] = useState<Matter.Body[]>([])
  const [isAddRemovePopupOpen, setIsAddRemovePopupOpen] = useState(false)
  const [isDetailPopupOpen, setIsDetailPopupOpen] = useState(false)
  const [selectedBall, setSelectedBall] =
    useState<NeedsBucketWaterNeedSetting | null>(null) // State for the selected ball
  const isHoveringFinalizeRef = useRef(false)

  const initialAllNeedsList = [
    ...needsList.map((need) => ({
      ...need,
      isUserDefined: true,
      isSelected: true,
      isSatisfiable: false, // placeholder, will be updated
    })),
    ...DEFAULT_OTHER_WATER_NEEDS.map((need) => ({
      ...need,
      isUserDefined: false,
      isSelected: false,
      isSatisfiable: false, // placeholder, will be updated later
    })),
  ]
  const [allNeeds, setAllNeeds] =
    useState<NeedsBucketWaterNeedSetting[]>(initialAllNeedsList)

  const handleOpenPopup = (ball: NeedsBucketWaterNeedSetting) => {
    setIsAddRemovePopupOpen(true) // Open the popup
    setSelectedBall(ball) // Set the selected ball
  }
  const handleClosePopup = (
    closingBall: NeedsBucketWaterNeedSetting,
    isSaving: boolean,
  ) => {
    if (isSaving) {
      const editingNeedIndex = allNeeds.findIndex(
        (need) => need === closingBall,
      )
      if (editingNeedIndex !== -1) {
        let updatedNeeds = [...allNeeds]
        updatedNeeds[editingNeedIndex] = {
          ...JSON.parse(JSON.stringify(updatedNeeds[editingNeedIndex])),
          isSelected:
            updatedNeeds[editingNeedIndex]?.isSelected !== undefined
              ? !updatedNeeds[editingNeedIndex].isSelected
              : false,
        }
        updatedNeeds = updatedNeeds.map((need) => {
          return {
            ...need,
            isSatisfiable: determineIfSatisfiable(),
            // isSatisfiable: determineIfSatisfiable(need, updatedNeeds),
          }
        })
        setAllNeeds(updatedNeeds)
      }
    }

    setIsAddRemovePopupOpen(false) // Close the popup
    setSelectedBall(null) // Clear the selected ball
  }

  useEffect(() => {
    let initialAllNeedsList = [
      ...needsList.map((need) => ({
        ...JSON.parse(JSON.stringify(need)),
        isUserDefined: true,
        isSelected: true,
        isSatisfiable: false, // placeholder, will be updated later
      })),
      ...DEFAULT_OTHER_WATER_NEEDS.map((need) => ({
        ...JSON.parse(JSON.stringify(need)),
        isUserDefined: false,
        isSelected: false,
        isSatisfiable: false, // placeholder, will be updated later
      })),
    ]
    initialAllNeedsList = initialAllNeedsList.map((need) => {
      return {
        ...need,
        // isSatisfiable: determineIfSatisfiable(need, initialAllNeedsList),
        isSatisfiable: determineIfSatisfiable(),
      }
    })
    setAllNeeds(initialAllNeedsList)
  }, [needsList])

  useEffect(() => {
    const engine = engineRef.current
    const { Render, Runner, World, Bodies } = Matter

    let matterWidth = width
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth
      matterWidth = containerWidth < width ? width : containerWidth
    }

    // const height = 800
    const bucketWidth = 230
    const wallThickness = 10
    const bucketHeight = 400

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: matterWidth,
        height,
        wireframes: false,
        background: "#ffffff",
      },
    })

    Render.run(render)
    const runner = Runner.create()
    Runner.run(runner, engine)

    const world = engine.world

    const ctx = render.context
    ctx.fillStyle = "#DCECE9"
    ctx.fillRect(0, 0, matterWidth / 3, height)

    // Create floor
    const floor = Bodies.rectangle(
      matterWidth / 2,
      height - wallThickness / 2,
      matterWidth,
      wallThickness,
      {
        isStatic: true,
        render: {
          visible: false, // Make the wall invisible
        },
      },
    )
    // Create left and right invisible walls
    const leftWall = Bodies.rectangle(
      -wallThickness / 2, // Position slightly outside the left edge
      height / 2,
      wallThickness,
      height,
      {
        isStatic: true,
        render: {
          visible: false, // Make the wall invisible
        },
      },
    )

    const rightWall = Bodies.rectangle(
      matterWidth + wallThickness / 2, // Position slightly outside the right edge
      height / 2,
      wallThickness,
      height,
      {
        isStatic: true,
        render: {
          visible: false, // Make the wall invisible
        },
      },
    )

    // Add the walls to the world
    World.add(world, [leftWall, rightWall])

    // Function to make a bucket at a given x position
    const makeBucket = (x: number, y: number) => {
      const bottom = Bodies.rectangle(x, y, bucketWidth, wallThickness, {
        isStatic: true,
      })
      const left = Bodies.rectangle(
        x - bucketWidth / 2 - 20,
        y - bucketHeight / 2,
        wallThickness,
        bucketHeight,
        {
          isStatic: true,
          angle: -Math.PI / 20,
        },
      )
      const right = Bodies.rectangle(
        x + bucketWidth / 2 + 20,
        y - bucketHeight / 2,
        wallThickness,
        bucketHeight,
        {
          isStatic: true,
          angle: Math.PI / 20,
        },
      )
      return [bottom, left, right]
    }

    const bucketBaseY = height * 0.9
    const leftX = matterWidth / 6
    const centerX = matterWidth / 2
    const rightX = (5 * matterWidth) / 6

    const buckets = [
      ...makeBucket(leftX, bucketBaseY),
      ...makeBucket(centerX, bucketBaseY),
      ...makeBucket(rightX, bucketBaseY),
    ]

    World.add(world, [...buckets, floor])

    // Add bucket labels once after the render is created
    // const ctx = render.context

    ctx.font = "bold 20px sans-serif"
    ctx.fillStyle = "#000000"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    const ballBodies = allNeeds.map(
      (need: NeedsBucketWaterNeedSetting, i: number) => {
        const existingBall: Matter.body = ballsRef.current.find(
          (ball) => JSON.stringify(ball.need) === JSON.stringify(need),
        )

        const shouldUpdate = existingBall
        console.log("shouldUpdate", need, shouldUpdate)

        let ball: Matter.body

        const isSatisfiable = need.isSatisfiable

        const row = Math.floor(i / 3)
        const x = need.isSelected ? centerX : isSatisfiable ? leftX : rightX
        const y = 100 + row * 30

        if (shouldUpdate) {
          console.log("Same bucket, reusing ball", need)
          ball = Bodies.circle(
            existingBall.position.x,
            existingBall.position.y,
            80,
            {
              mass: 10,
              render: {
                fillStyle: need.isSelected
                  ? "#B0B0B0"
                  : isSatisfiable
                    ? "#D6E5BD"
                    : "#FFCBCB",
              },
            },
          )
        } else {
          ball = Bodies.circle(x, y, 80, {
            mass: 10,
            render: {
              fillStyle: need.isSelected
                ? "#B0B0B0"
                : isSatisfiable
                  ? "#D6E5BD"
                  : "#FFCBCB",
            },
          })
        }

        ball.need = need
        return ball
      },
    )

    ballsRef.current = ballBodies

    World.add(world, ballBodies)

    Matter.Events.on(render, "afterRender", () => {
      const ctx = render.context
      ctx.font = "bold 25px sans-serif"
      ctx.fillStyle = "#000000"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      if (isHoveringFinalizeRef.current) {
        ctx.globalAlpha = 0.08 // Set global opacity to 50%
        ctx.fillStyle = "#00FF00" // Red color
        ctx.fillRect(matterWidth / 3, 0, matterWidth / 3, height) // Draw rectangle
        ctx.fillStyle = "#000000"
        ctx.globalAlpha = 1.0 // Reset global opacity to fully opaque
      }

      ctx.fillText("Satisfiable", leftX, height * 0.1)
      ctx.fillText("Currently Selected", centerX, height * 0.1)
      ctx.fillText("Unsatisfiable", rightX, height * 0.1)

      const calculateOffset = (
        x: number,
        y: number,
        words: string[],
        maxWidth: number,
        lineHeight: number,
      ) => {
        let numRowsNeeded = 0
        let line = ""
        words.forEach((word) => {
          const testLine = line + word + " "
          const testWidth = ctx.measureText(testLine).width
          if (testWidth > maxWidth) {
            numRowsNeeded += 1
            line = word + " "
          } else {
            line = testLine
          }
        })
        return -lineHeight * (numRowsNeeded / 2)
      }

      // Draw each ball's label
      ballBodies.forEach((ball, index) => {
        const label = getLabel(ball?.need) || ""
        const { x, y } = ball.position

        const overlay = document.getElementById(`ball-overlay-${index}`)
        if (overlay) {
          overlay.style.left = `${x}px`
          overlay.style.top = `${y}px`
        }

        ctx.font = "16px sans-serif"
        ctx.fillStyle = "#000000" // Text color
        ctx.textAlign = "center" // Options: "left", "right", "center", "start", "end"
        ctx.textBaseline = "middle" // Options: "top", "hanging", "middle", "alphabetic", "ideographic", "bottom"

        // Wrap text if it exceeds a certain width
        const maxWidth = 120
        const words = label.split(" ")
        let line = ""
        const lineHeight = 20
        let offsetY = calculateOffset(x, y, words, maxWidth, lineHeight)

        words.forEach((word, index) => {
          const testLine = line + word + " "
          const testWidth = ctx.measureText(testLine).width
          if (testWidth > maxWidth && index > 0) {
            ctx.fillText(line, x, y + offsetY)
            line = word + " "
            offsetY += lineHeight
          } else {
            line = testLine
          }
        })
        ctx.fillText(line, x, y + offsetY) // Draw the text
        const btn = document.getElementById(`ball-btn-${index}`)

        if (btn) {
          btn.style.left = `${x}px`
          btn.style.top = `${y + offsetY}px`
        }
      })
    })

    // Cleanup
    return () => {
      // Disable scrolling
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
      Matter.Render.stop(render)
      Matter.Runner.stop(runner)
      Matter.World.clear(world)
      Matter.Engine.clear(engine)
      render.canvas.remove()
      // // Restore scrolling
      document.body.style.overflow = originalOverflow
    }
  }, [allNeeds, width, height])

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
      }}
    >
      <Typography variant="h3">
        Explore different{" "}
        <span style={{ fontStyle: "italic" }}>water needs</span>, co-benefits,
        and trade-offs!
      </Typography>
      <Box
        sx={{
          border: "3px solid #ccc",
          borderRadius: 1,
          p: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          mb: 2,
          gap: 1,
        }}
      >
        <Typography variant="h4" sx={{}}>
          Now that you&apos;ve added your water needs, let&apos;s explore what
          others&apos; water needs are! <br /> Some other water needs are{" "}
          <span
            style={{
              background: "#D6E5BD",
              borderRadius: "5px",
              padding: "2px 4px",
            }}
          >
            satisfiable
          </span>{" "}
          , but some are{" "}
          <span
            style={{
              background: "#FFCBCB",
              borderRadius: "5px",
              padding: "2px 4px",
            }}
          >
            unsatisfiable
          </span>
          . <br />
          <span
            style={{
              background: "#D6E5BD",
              borderRadius: "5px",
              padding: "2px 4px",
            }}
          >
            Satisfiable
          </span>{" "}
          simply means, in addition to your selected needs, COEQWAL can find a
          scenario that meets that need and{" "}
          <span
            style={{
              background: "#FFCBCB",
              borderRadius: "5px",
              padding: "2px 4px",
            }}
          >
            unsatisfiable
          </span>{" "}
          the opposite.
          <br />
          <br />
          You can add or remove any water need to your selection by clicking on
          the{" "}
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              verticalAlign: "middle",
            }}
          >
            <AddIcon fontSize="small" sx={{ marginBottom: "2px" }} />
          </Box>{" "}
          or{" "}
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              verticalAlign: "middle",
            }}
          >
            <CloseIcon fontSize="small" sx={{ marginBottom: "2px" }} />
          </Box>
          icons.
          <br />
          <br />
          Click on each water need to learn more about it!
          <br />
          <span style={{ fontStyle: "italic", fontSize: "0.8em" }}>
            [Dev note: the sat/unsat ident. is currently random...]
          </span>
        </Typography>
      </Box>
      {selectedBall && (
        <Dialog
          open={isAddRemovePopupOpen}
          onClose={() => handleClosePopup(selectedBall, false)}
          slotProps={{
            paper: {
              sx: { backgroundColor: "white" },
            },
          }}
        >
          <DialogTitle>Edit Water Need</DialogTitle>
          <DialogContent>
            <Typography variant="h6">
              {selectedBall?.isSelected
                ? `Remove need -- ${selectedBall?.name} -- from my selection`
                : `Add need --  ${selectedBall?.name} -- to my selection`}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => handleClosePopup(selectedBall, false)}
              color="primary"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleClosePopup(selectedBall, true)}
              color="primary"
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}
      <Dialog
        open={isDetailPopupOpen}
        slotProps={{
          paper: {
            sx: { backgroundColor: "white" },
          },
        }}
      >
        <DialogTitle variant="h4">
          What&apos;s this{" "}
          <span style={{ fontStyle: "italic" }}>Water Need</span> about?
        </DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "fit-content",
            gap: 1,
          }}
        >
          <Box
            sx={{
              border: "3px solid #ccc",
              borderRadius: 1,
              width: "fit-content",
              p: 2,
            }}
          >
            <Typography variant="h4" sx={{ mb: 2 }}>
              {selectedBall?.setting?.title
                ? getTitleText(
                    selectedBall.setting,
                    WATER_NEED_TYPES.find(
                      (item) => item.label === selectedBall.name,
                    )?.titleGrammar || "",
                  )
                : "No title available"}
            </Typography>
            <Typography variant="h5">
              {selectedBall?.setting?.rule
                ? getRuleText(
                    selectedBall.setting,
                    WATER_NEED_TYPES.find(
                      (item) => item.label === selectedBall.name,
                    )?.ruleGrammar || "",
                  )
                : "No rule available"}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              width: "fit-content",
            }}
          >
            <Chip
              label={`${
                selectedBall?.isUserDefined
                  ? "👤 Defined by You!"
                  : "⚙️ A Predefined need known to COEQWAL"
              }`}
              color={selectedBall?.isUserDefined ? "default" : "default"}
            />
            {!selectedBall?.isSelected && (
              <Chip
                label={`${
                  selectedBall?.isSatisfiable
                    ? "✅ Satisfiable"
                    : "⚠️ Unsatisfiable with current selection"
                }`}
                sx={{
                  backgroundColor: selectedBall?.isSatisfiable
                    ? "#D6E5BD"
                    : "#FFCBCB",
                }}
              />
            )}
          </Box>
          {!selectedBall?.isSatisfiable && !selectedBall?.isSelected && (
            <Box>
              <Typography variant="h5" sx={{}}>
                Why isn&apos;t this need satisfiable?
              </Typography>
              <Typography variant="h6" sx={{}}>
                This water need is in conflict with [Water Need Name]
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            color="primary"
            onClick={() => {
              setIsDetailPopupOpen(false)
              console.log("Selected Ball", selectedBall)
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <div ref={containerRef} style={{ width: "100%" }}>
        <div style={{ position: "relative" }}>
          {ballsRef.current.map((ball, i) => (
            <Box
              key={i}
              id={`ball-overlay-${i}`}
              sx={{
                justifyContent: "center",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                position: "absolute",
                transform: "translate(-50%, -50%)",
                width: "100px",
                height: "100px",
                "&:hover": {
                  // backgroundColor: "blue", // Change background color on hover
                  // transform: "translate(-50%, -50%) scale(1.1)", // Slightly enlarge on hover
                  cursor: "pointer", // Change cursor to pointer
                },
              }}
              onClick={() => {
                setIsDetailPopupOpen(true)
                setSelectedBall(ball?.need)
                console.log("Ball clicked:", ball)
              }}
            ></Box>
          ))}
          {ballsRef.current.map((ball, i) => (
            <Box
              key={i}
              id={`ball-btn-${i}`}
              sx={{
                justifyContent: "center",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                position: "absolute",
                transform: "translate(-50%, 0%)",
              }}
            >
              <IconButton
                sx={{
                  display: ball?.need?.isUserDefined ? "flex" : "none",
                }}
                onClick={() => {
                  const curWaterNeed = ball?.need
                  if (curWaterNeed) {
                    const idx = needsList.findIndex(
                      (need) =>
                        JSON.stringify(need) ===
                        JSON.stringify({
                          name: curWaterNeed["name"],
                          setting: curWaterNeed["setting"],
                        }),
                    )
                    editWaterNeed(idx)
                  }
                }}
              >
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => handleOpenPopup(ball?.need)}>
                {ball?.need?.isSelected ? <CloseIcon /> : <AddIcon />}
              </IconButton>
            </Box>
          ))}
          <div ref={sceneRef} style={{ height: `${height}px` }} />
        </div>
      </div>
      <Button
        variant="outlined"
        startIcon={<CheckIcon />}
        onClick={() => {
          finishWaterNeed(allNeeds.filter((need) => need.isSelected))
        }}
        onMouseEnter={() => (isHoveringFinalizeRef.current = true)}
        onMouseLeave={() => (isHoveringFinalizeRef.current = false)}
        sx={{
          color: "black",
          borderColor: "black",
          width: "fit-content",
          my: 2,
        }}
      >
        <Typography variant="h4">
          I&apos;m happy with the selected water needs!
        </Typography>
      </Button>
    </Box>
  )
}

export default BucketScene
