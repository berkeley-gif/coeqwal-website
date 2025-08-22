import { BasePanel, Spacer, ArrowHead } from "@repo/ui"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { ScrollIndicator } from "@repo/motion/components"
import { FloatingAmbientCircles } from "../components/FloatingAmbientCircles"
import { FloatingImageMarkers } from "../components/FloatingImageMarkers"
import { ambientCircles } from "../config/ambientCircles"
import { floatingMarkers } from "../config/floatingMarkers"

const IntroSection = () => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        background: (theme) => `
            linear-gradient(to bottom, ${theme.palette.brand.sky}, ${theme.palette.brand.water})
          `,
        minHeight: "200vh",
      }}
    >
      {/* Full screen home panel */}
      <BasePanel
        id="home"
        fullHeight={true}
        fullWidth={true}
        background="transparent"
        paddingVariant="none"
        includeHeaderSpacing={false}
        sx={{
          position: "relative",
        }}
      >
        {/* Ambient background circles, scattered behind */}
        <FloatingAmbientCircles
          circles={ambientCircles}
          zIndex={theme.zIndex.introBackgroundImages}
        />

        {/* Floating image markers with halos */}
        <FloatingImageMarkers
          markers={floatingMarkers}
          zIndex={theme.zIndex.introForegroundImages}
          showHalos={true}
        />

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
              height: `calc(100vh - ${theme.layout.headerHeight}px)`, // Full height minus header
              position: "relative",
              zIndex: (theme) => theme.zIndex.introText,
              textAlign: "left",
            }}
          >

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
      </BasePanel>

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
