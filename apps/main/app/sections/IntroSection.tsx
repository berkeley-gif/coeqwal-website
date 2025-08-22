import { BasePanel, Spacer, ArrowHead } from "@repo/ui"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { ScrollIndicator } from "@repo/motion/components"
import { motion } from "@repo/motion"

const IntroSection = () => {
  const theme = useTheme()

  // Generate animation parameters for floating effect, scaled by size
  const generateFloatingAnimation = (sizeVw = 14) => {
    // Scale movement based on size (18vw is largest, gets scale of 1.0)
    const sizeScale = sizeVw / 18

    const bobDelay = Math.random() * 3 // 0-3 seconds
    const driftDelay = Math.random() * 5 // 0-5 seconds
    const baseBobAmount = 8 + Math.random() * 8 // 8-16px base vertical movement
    const baseDriftAmount = 15 + Math.random() * 15 // 15-30px base horizontal drift
    const bobDuration = 3 + Math.random() * 2 // 3-5 seconds
    const driftDuration = 8 + Math.random() * 6 // 8-14 seconds

    // Scale movement amounts by size
    const bobAmount = baseBobAmount * sizeScale
    const driftAmount = baseDriftAmount * sizeScale
    const rotateAmount = 1 * sizeScale

    return {
      animate: {
        y: [0, -bobAmount, 0],
        x: [-driftAmount / 2, driftAmount / 2, -driftAmount / 2],
        rotate: [-rotateAmount, rotateAmount, -rotateAmount],
      },
      transition: {
        y: {
          duration: bobDuration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: bobDelay,
        },
        x: {
          duration: driftDuration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: driftDelay,
        },
        rotate: {
          duration: bobDuration * 1.3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: bobDelay * 0.7,
        },
      },
    }
  }

  return (
    <Box
      sx={{
        background: (theme) => `
            linear-gradient(to bottom, ${theme.palette.brand.sky}, ${theme.palette.brand.water})
          `,
        minHeight: "200vh",
      }}
    >
      {/* Hero panel - full screen */}
      <Box
        id="home"
        sx={{
          position: "relative",
          width: "100vw",
          height: "100vh",
        }}
      >
        {/* Decorative background circles, scattered behind */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: (theme) => theme.zIndex.introBackgroundImages,
            pointerEvents: "none",
          }}
        >
          {/* White decorative circles */}
          <Box
            component={motion.div}
            {...generateFloatingAnimation(10)}
            sx={{
              position: "absolute",
              width: "10vw",
              height: "10vw",
              top: "18%",
              left: "34%",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            }}
          />
          <Box
            component={motion.div}
            {...generateFloatingAnimation(18)}
            sx={{
              position: "absolute",
              width: "18vw",
              height: "18vw",
              top: "24%",
              left: "48%",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            }}
          />
          <Box
            component={motion.div}
            {...generateFloatingAnimation(10)}
            sx={{
              position: "absolute",
              width: "10vw",
              height: "10vw",
              top: "66%",
              left: "60%",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            }}
          />
          <Box
            component={motion.div}
            {...generateFloatingAnimation(12)}
            sx={{
              position: "absolute",
              width: "12vw",
              height: "12vw",
              top: "30%",
              left: "74%",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            }}
          />

          {/* Blue decorative circles */}
          <Box
            component={motion.div}
            {...generateFloatingAnimation(10)}
            sx={{
              position: "absolute",
              width: "10vw",
              height: "10vw",
              top: "18%",
              left: "35%",
              borderRadius: "50%",
              backgroundColor: "rgba(42, 82, 135, 0.2)",
            }}
          />
          <Box
            component={motion.div}
            {...generateFloatingAnimation(10)}
            sx={{
              position: "absolute",
              width: "6vw",
              height: "6vw",
              top: "62%",
              left: "78%",
              borderRadius: "50%",
              backgroundColor: "rgba(42, 82, 135, 0.2)",
            }}
          />
          <Box
            component={motion.div}
            {...generateFloatingAnimation(4)}
            sx={{
              position: "absolute",
              width: "4vw",
              height: "4vw",
              top: "32%",
              left: "86%",
              borderRadius: "50%",
              backgroundColor: "rgba(42, 82, 135, 0.2)",
            }}
          />
        </Box>

        {/* Circular crop images with halos */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: (theme) => theme.zIndex.introForegroundImages,
            pointerEvents: "none",
          }}
        >
          {/* Image 7 with halo - Top left of cluster */}
          <Box
            component={motion.div}
            {...generateFloatingAnimation(14)}
            sx={{
              position: "absolute",
              top: "20%",
              left: "42%",
            }}
          >
            {/* Halo circle for Image 7 */}
            <Box
              sx={{
                position: "absolute",
                width: "calc(14vw + 1.56vw)",
                height: "calc(14vw + 1.56vw)",
                top: "-0.78vw",
                left: "-0.78vw",
                borderRadius: "50%",
                backgroundColor: "rgba(42, 82, 135, 0.2)",
                zIndex: -1,
              }}
            />
            <Box
              component="img"
              src="/images/circular-crops/8.png"
              sx={{
                width: "14vw",
                height: "14vw",
                borderRadius: "50%",
              }}
            />
          </Box>

          {/* Image 12 with halo - Top right of cluster */}
          <Box
            component={motion.div}
            {...generateFloatingAnimation(10)}
            sx={{
              position: "absolute",
              top: "16%",
              left: "78%",
            }}
          >
            {/* Halo circle for Image 12 */}
            <Box
              sx={{
                position: "absolute",
                width: "calc(10vw + 1.11vw)",
                height: "calc(10vw + 1.11vw)",
                top: "-0.56vw",
                left: "-0.56vw",
                borderRadius: "50%",
                backgroundColor: "rgba(42, 82, 135, 0.2)",
                zIndex: -1,
              }}
            />
            <Box
              component="img"
              src="/images/circular-crops/12.png"
              sx={{
                width: "10vw",
                height: "10vw",
                borderRadius: "50%",
              }}
            />
          </Box>

          {/* Image 9 with halo - Bottom right of cluster */}
          <Box
            component={motion.div}
            {...generateFloatingAnimation(12)}
            sx={{
              position: "absolute",
              top: "62%",
              left: "68%",
            }}
          >
            {/* Halo circle for Image 9 */}
            <Box
              sx={{
                position: "absolute",
                width: "calc(12vw + 1.33vw)",
                height: "calc(12vw + 1.33vw)",
                top: "-0.67vw",
                left: "-0.67vw",
                borderRadius: "50%",
                backgroundColor: "rgba(42, 82, 135, 0.2)",
                zIndex: -1,
              }}
            />
            <Box
              component="img"
              src="/images/circular-crops/9.png"
              sx={{
                width: "12vw",
                height: "12vw",
                borderRadius: "50%",
              }}
            />
          </Box>

          {/* Image 14 with halo - Bottom left of cluster */}
          <Box
            component={motion.div}
            {...generateFloatingAnimation(10)}
            sx={{
              position: "absolute",
              top: "42%",
              left: "80%",
            }}
          >
            {/* Halo circle for Image 14 */}
            <Box
              sx={{
                position: "absolute",
                width: "calc(10vw + 1.11vw)",
                height: "calc(10vw + 1.11vw)",
                top: "-0.56vw",
                left: "-0.56vw",
                borderRadius: "50%",
                backgroundColor: "rgba(42, 82, 135, 0.2)",
                zIndex: -1,
              }}
            />
            <Box
              component="img"
              src="/images/circular-crops/14.png"
              sx={{
                width: "10vw",
                height: "10vw",
                borderRadius: "50%",
              }}
            />
          </Box>

          {/* Image 11 with halo - Left side of cluster */}
          <Box
            component={motion.div}
            {...generateFloatingAnimation(16)}
            sx={{
              position: "absolute",
              top: "50%",
              left: "46%",
            }}
          >
            {/* Halo circle for Image 11 */}
            <Box
              sx={{
                position: "absolute",
                width: "calc(16vw + 1.78vw)",
                height: "calc(16vw + 1.78vw)",
                top: "-0.89vw",
                left: "-0.89vw",
                borderRadius: "50%",
                backgroundColor: "rgba(42, 82, 135, 0.2)",
                zIndex: -1,
              }}
            />
            <Box
              component="img"
              src="/images/circular-crops/4.png"
              sx={{
                width: "16vw",
                height: "16vw",
                borderRadius: "50%",
              }}
            />
          </Box>
        </Box>

        {/* Image 3 with halo - Center cluster (on top of all others) */}
        <Box
          component={motion.div}
          {...generateFloatingAnimation(18)}
          sx={{
            position: "absolute",
            top: "25%",
            left: "60%",
            zIndex: (theme) => theme.zIndex.introForegroundImages + 1,
          }}
        >
          {/* Halo circle for Image 3 */}
          <Box
            sx={{
              position: "absolute",
              width: "calc(18vw + 2vw)",
              height: "calc(18vw + 2vw)",
              top: "-1vw",
              left: "-1vw",
              borderRadius: "50%",
              backgroundColor: "rgba(42, 82, 135, 0.2)",
              zIndex: -1,
            }}
          />
          <Box
            component="img"
            src="/images/circular-crops/3.png"
            sx={{
              width: "18vw",
              height: "18vw",
              borderRadius: "50%",
            }}
          />
        </Box>

        {/* Hero text content */}
        <BasePanel
          id="home-content"
          paddingVariant="very-wide"
          fullHeight={true}
          background="transparent"
          includeHeaderSpacing={true}
          sx={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            overflow: "visible",
          }}
        >
          {/* Background circles (below text) */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: (theme) => theme.zIndex.introBackgroundImages,
              pointerEvents: "none",
            }}
          ></Box>

          {/* Text content - left aligned, vertically centered minus header */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              width: "100%",
              height: `calc(100vh - 64px)`, // Full height minus header
              position: "relative",
              zIndex: (theme) => theme.zIndex.introText,
              textAlign: "left",
            }}
          >
            {/* H1 with each word on separate line */}
            <Typography
              variant="h1"
              sx={{
                mb: 2,
              }}
            >
              Rethink
              <br />
              California
              <br />
              Water
            </Typography>

            {/* Body text */}
            <Typography
              variant="body1"
              sx={{
                textAlign: "left",
                maxWidth: (theme) => theme.layout.textContainer.maxWidth,
                mb: 4,
              }}
            >
              Explore a range of Central Valley water scenarios and discover
              possibilities for water management across the state, under current
              conditions and future climates.
            </Typography>

            {/* Arrow positioned at text block midpoint */}
            <Box
              sx={{
                width: (theme) => theme.layout.textContainer.maxWidth,
                display: "flex",
                justifyContent: "center",
                mt: 4,
              }}
            >
              <ScrollIndicator
                scrollToId="frontmatter"
                color={theme.palette.blue.darkest}
                animationComplete={true}
                delay={1.0}
              >
                <ArrowHead
                  size={28}
                  style={{
                    transform: "rotate(90deg)",
                  }}
                />
              </ScrollIndicator>
            </Box>
          </Box>
        </BasePanel>
      </Box>

      {/* Spacer between full-screen panels */}
      <Spacer height={{ xs: 48, md: 48 }} />

      {/* Second panel - Overview content
      <BasePanel
        id="overview"
        fullHeight={false}
        fullWidth
        background="transparent"
        paddingVariant="very-wide"
        includeHeaderSpacing={true}
        sx={{
          color: (theme) => theme.palette.primary.dark,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            maxWidth: { xs: "600px", md: "500px" },
          }}
        >
          <Box
            component="img"
            src="/images/home_collage/birds_top.png"
            sx={{
              position: "absolute",
              left: "-70%",
              top: "30%",
              transform: "translateY(-50%)",
              width: "280px",
              height: "280px",
              zIndex: (theme) => theme.zIndex.introBackgroundImages,
            }}
          />

          <Box
            sx={{ textAlign: "left", maxWidth: (theme) => theme.layout.textContainer.maxWidth }}
          >
            <Typography variant="body1">
              California&apos;s Central Valley water depends
              <br />
              on two main things:
            </Typography>
            <Box component="ol" sx={{ mt: 1, pl: 3 }}>
              <Box component="li" sx={{ mb: 1 }}>
                <Typography variant="body1">
                  How much rain and snow we get.
                </Typography>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Typography variant="body1">
                  How we choose to manage it.
                </Typography>
              </Box>
            </Box>
          </Box>

          <ScrollIndicator
            scrollToId="frontmatter"
            color={theme.palette.blue.darkest}
            animationComplete={true}
            delay={1.0}
            style={{ marginTop: "2rem" }}
          >
            <ArrowHead
              size={28}
              style={{
                transform: "rotate(90deg)",
              }}
            />
          </ScrollIndicator>
        </Box>
      </BasePanel> */}

      {/* Third panel */}
      <Box
        sx={{
          background: `url('/images/home_collage/newcollage_wetland.png')`,
          backgroundSize: "100vw auto",
          backgroundPosition: "top right",
          backgroundRepeat: "no-repeat",
          minHeight: "180vh", // Accomodates background image
        }}
      >
        <BasePanel
          id="frontmatter"
          fullHeight={false}
          fullWidth
          background="transparent"
          paddingVariant="none"
          includeHeaderSpacing={true}
          sx={{
            color: (theme) => theme.palette.primary.dark,
            position: "relative",
            minHeight: "180vh",
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: "100%",
              minHeight: "180vh",
            }}
          >
            <Box
              component="img"
              src="/images/home_collage/birds_top.png"
              sx={{
                position: "absolute",
                left: "-56%",
                top: "20%",
                transform: "translateY(-50%)",
                width: "280px",
                height: "280px",
                zIndex: (theme) => theme.zIndex.introBackgroundImages,
              }}
            />

            <Box
              sx={{
                textAlign: "left",
                maxWidth: (theme) => theme.layout.textContainer.maxWidth,
                position: "absolute",
                top: "34%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "100%",
                px: 2,
              }}
            >
              <Typography variant="body1">
                California&apos;s Central Valley water depends on two main
                things:
              </Typography>
              <Box component="ol" sx={{ mt: 1, mb: 2, pl: 3 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body1">
                    How much rain and snow we get.
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body1">
                    How we choose to manage it.
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body1" sx={{ mb: 2 }}>
                We already face difficult choices. Climate change brings deeper
                droughts, bigger floods, and growing uncertainty.
              </Typography>

              <Typography variant="body1">
                The COEQWAL (Collaboratory for Equity in Water Allocation)
                project has modeled 30 alternative water management scenarios
                for the Central Valley water systems that supply most of the
                state. For each of these scenarios, we also modeled 5 future
                climate possibilities.
              </Typography>

              <ScrollIndicator
                scrollToId="regions"
                color={theme.palette.blue.darkest}
                animationComplete={true}
                delay={1.0}
                style={{
                  marginTop: "2rem",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <ArrowHead
                  size={28}
                  style={{
                    transform: "rotate(90deg)",
                  }}
                />
              </ScrollIndicator>
            </Box>
          </Box>
        </BasePanel>
      </Box>

      <Spacer height={{ xs: 48, md: 160 }} />

      {/* Fourth panel - California map background with right-aligned text */}
      <BasePanel
        id="regions"
        fullHeight={false}
        fullWidth
        background="transparent"
        paddingVariant="content-first"
        includeHeaderSpacing={true}
        sx={{
          background: `url('/images/california.png')`,
          backgroundSize: "contain",
          backgroundPosition: "10% center",
          backgroundRepeat: "no-repeat",
          height: "140vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            maxWidth: (theme) => theme.layout.textContainer.maxWidth,
            textAlign: "left",
            color: (theme) => theme.palette.blue.darkest,
            ml: "auto", // Keep it right-aligned but not as extreme
            mr: 4, // Add some margin from the right edge
          }}
        >
          <Typography variant="body1" sx={{ mb: 3 }}>
            The scenarios we run cover these areas of California:
          </Typography>

          <Box component="ul" sx={{ mb: 3, pl: 3 }}>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">Sacramento Valley</Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">San Joaquin Valley</Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">
                Sacramento-San Joaquin Delta
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <Typography variant="body1">Tulare Basin.</Typography>
            </Box>
          </Box>

          <Typography variant="body1">
            The goal of the COEQWAL project is to make opaque water management
            transparent and accessible. On this site you can explore alternative
            water management scenarios, understand the trade-offs, and use data
            to advocate for your community.
          </Typography>

          <ScrollIndicator
            scrollToId="content-panels"
            color={theme.palette.blue.darkest}
            animationComplete={true}
            delay={1.0}
            style={{
              marginTop: "2rem",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <ArrowHead
              size={28}
              style={{
                transform: "rotate(90deg)",
              }}
            />
          </ScrollIndicator>
        </Box>
      </BasePanel>
    </Box>
  )
}

export default IntroSection
