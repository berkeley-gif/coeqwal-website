import React from "react"
import { BasePanel, Spacer, ArrowHead } from "@repo/ui"
import { Box, Typography } from "@repo/ui/mui"
import { ScrollIndicator } from "@repo/motion/components"

const IntroSection: React.FC = () => {
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
        id="intro"
        sx={{
          position: "relative",
          width: "100vw",
          height: "100vh",
        }}
      >
        {/* Circular crop images overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: (theme) => theme.zIndex.introForegroundImages,
            pointerEvents: "none",
          }}
        >
          {/* Image 1 */}
          <Box
            component="img"
            src="/images/circular-crops/1.png"
            sx={{
              position: "absolute",
              width: "120px",
              height: "120px",
              top: "10%",
              right: "15%",
              borderRadius: "50%",
            }}
          />
          {/* Image 2 */}
          <Box
            component="img"
            src="/images/circular-crops/2.png"
            sx={{
              position: "absolute",
              width: "80px",
              height: "80px",
              top: "25%",
              right: "8%",
              borderRadius: "50%",
            }}
          />
          {/* Image 3 */}
          <Box
            component="img"
            src="/images/circular-crops/3.png"
            sx={{
              position: "absolute",
              width: "100px",
              height: "100px",
              top: "35%",
              right: "25%",
              borderRadius: "50%",
            }}
          />
          {/* Image 4 */}
          <Box
            component="img"
            src="/images/circular-crops/4.png"
            sx={{
              position: "absolute",
              width: "90px",
              height: "90px",
              bottom: "30%",
              right: "12%",
              borderRadius: "50%",
            }}
          />
          {/* Image 5 */}
          <Box
            component="img"
            src="/images/circular-crops/5.png"
            sx={{
              position: "absolute",
              width: "110px",
              height: "110px",
              bottom: "15%",
              right: "20%",
              borderRadius: "50%",
            }}
          />
          {/* Image 6 */}
          <Box
            component="img"
            src="/images/circular-crops/6.png"
            sx={{
              position: "absolute",
              width: "75px",
              height: "75px",
              top: "15%",
              right: "35%",
              borderRadius: "50%",
            }}
          />
          {/* Image 7 */}
          <Box
            component="img"
            src="/images/circular-crops/7.png"
            sx={{
              position: "absolute",
              width: "95px",
              height: "95px",
              top: "45%",
              right: "5%",
              borderRadius: "50%",
            }}
          />
          {/* Image 8 */}
          <Box
            component="img"
            src="/images/circular-crops/8.png"
            sx={{
              position: "absolute",
              width: "85px",
              height: "85px",
              bottom: "40%",
              right: "30%",
              borderRadius: "50%",
            }}
          />
          {/* Image 9 */}
          <Box
            component="img"
            src="/images/circular-crops/9.png"
            sx={{
              position: "absolute",
              width: "70px",
              height: "70px",
              top: "60%",
              right: "18%",
              borderRadius: "50%",
            }}
          />
          {/* Image 10 */}
          <Box
            component="img"
            src="/images/circular-crops/10.png"
            sx={{
              position: "absolute",
              width: "105px",
              height: "105px",
              top: "20%",
              right: "45%",
              borderRadius: "50%",
            }}
          />
          {/* Image 11 */}
          <Box
            component="img"
            src="/images/circular-crops/11.png"
            sx={{
              position: "absolute",
              width: "88px",
              height: "88px",
              bottom: "25%",
              right: "40%",
              borderRadius: "50%",
            }}
          />
          {/* Image 12 */}
          <Box
            component="img"
            src="/images/circular-crops/12.png"
            sx={{
              position: "absolute",
              width: "92px",
              height: "92px",
              top: "50%",
              right: "40%",
              borderRadius: "50%",
            }}
          />
          {/* Image 13 */}
          <Box
            component="img"
            src="/images/circular-crops/13.png"
            sx={{
              position: "absolute",
              width: "78px",
              height: "78px",
              bottom: "10%",
              right: "35%",
              borderRadius: "50%",
            }}
          />
          {/* Image 14 */}
          <Box
            component="img"
            src="/images/circular-crops/14.png"
            sx={{
              position: "absolute",
              width: "98px",
              height: "98px",
              top: "8%",
              right: "25%",
              borderRadius: "50%",
            }}
          />
          {/* Image 15 */}
          <Box
            component="img"
            src="/images/circular-crops/15.png"
            sx={{
              position: "absolute",
              width: "82px",
              height: "82px",
              top: "65%",
              right: "8%",
              borderRadius: "50%",
            }}
          />
          {/* Image 16 */}
          <Box
            component="img"
            src="/images/circular-crops/16.png"
            sx={{
              position: "absolute",
              width: "115px",
              height: "115px",
              bottom: "5%",
              right: "15%",
              borderRadius: "50%",
            }}
          />
        </Box>

        {/* Hero text content */}
        <BasePanel
          id="intro-main"
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
                mb: 4,
                textAlign: "left",
                lineHeight: 1.1,
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
                maxWidth: { xs: "600px", md: "500px" },
                mb: 4,
              }}
            >
              Explore a range of Central Valley water scenarios and discover
              possibilities for water management across the state, under current
              conditions and future climates.
            </Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                maxWidth: { xs: "600px", md: "500px" }, // Match text block width
              }}
            >
              <ScrollIndicator
                scrollToId="overview"
                color={(theme) => theme.palette.blue.darkest}
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

      {/* Second panel - Overview content */}
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
            src="/images/circular-crops/collage_water.png"
            sx={{
              position: "absolute",
              left: "-120px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "80px",
              height: "80px",
              zIndex: (theme) => theme.zIndex.introBackgroundImages,
            }}
          />

          <Box
            sx={{ textAlign: "left", maxWidth: { xs: "600px", md: "500px" } }}
          >
            <Typography variant="body1">
              California&apos;s Central Valley water depends
              <br />
              on two main things:
            </Typography>
            <Box component="ol" sx={{ mt: 0, pl: 3 }}>
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
            scrollToId="third-panel"
            color={(theme) => theme.palette.blue.darkest}
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
      </BasePanel>

      {/* Third panel */}
      <BasePanel
        id="third-panel"
        fullHeight={false}
        fullWidth
        background="transparent"
        paddingVariant="wide"
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
            src="/images/circular-crops/right_side.png"
            sx={{
              position: "absolute",
              right: "-120px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "80px",
              height: "80px",
              zIndex: (theme) => theme.zIndex.introBackgroundImages,
            }}
          />

          <Box
            sx={{ textAlign: "left", maxWidth: { xs: "600px", md: "500px" } }}
          >
            <Typography variant="body1" sx={{ mb: 2 }}>
              The future of California&apos;s Central Valley water depends on
              climate change and our choices. We have to plan for both.
            </Typography>

            <Typography variant="body1">
              The COEQWAL project has run 30 alternative water management
              scenarios for the Central Valley water systems that feed most of
              the state. For each of these scenarios, we considered 5 future
              climate possibilities.
            </Typography>
          </Box>

          <ScrollIndicator
            scrollToId="fourth-panel"
            color={(theme) => theme.palette.blue.darkest}
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
      </BasePanel>

      <Spacer height={{ xs: 48, md: 160 }} />

      {/* Fourth panel - California map background with right-aligned text */}
      <BasePanel
        id="fourth-panel"
        fullHeight={false}
        fullWidth
        background="transparent"
        paddingVariant="very-wide"
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
            marginLeft: "auto",
            maxWidth: "400px",
            textAlign: "left",
            color: (theme) => theme.palette.blue.darkest,
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
              <Typography variant="body1">Tulare Basin</Typography>
            </Box>
          </Box>

          <Typography variant="body1">
            The goal of the COEQWAL project is to make opaque water management
            transparent and accessible. On this site you can explore alternative
            water management scenarios, understand the trade-offs, and use data
            to advocate for your community.
          </Typography>
        </Box>
      </BasePanel>
    </Box>
  )
}

export default IntroSection
