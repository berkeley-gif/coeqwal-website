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
        {/* Decorative background circles - scattered behind everything */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: (theme) => theme.zIndex.introBackgroundImages,
            pointerEvents: "none",
          }}
        >
          {/* Blue decorative circles - layered asymmetric pattern */}
          <Box
            sx={{
              position: "absolute",
              width: "260px",
              height: "260px",
              top: "25%",
              left: "35%",
              borderRadius: "50%",
              backgroundColor: "rgba(42, 82, 135, 0.2)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              width: "180px",
              height: "180px",
              top: "8%",
              left: "75%",
              borderRadius: "50%",
              backgroundColor: "rgba(42, 82, 135, 0.2)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              width: "200px",
              height: "200px",
              top: "68%",
              left: "88%",
              borderRadius: "50%",
              backgroundColor: "rgba(42, 82, 135, 0.2)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              width: "220px",
              height: "220px",
              top: "26%",
              left: "75%",
              borderRadius: "50%",
              backgroundColor: "rgba(42, 82, 135, 0.2)",
            }}
          />

          {/* White decorative circles - layered asymmetric pattern */}
          <Box
            sx={{
              position: "absolute",
              width: "230px",
              height: "230px",
              top: "15%",
              left: "62%",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              width: "190px",
              height: "190px",
              top: "45%",
              left: "82%",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              width: "220px",
              height: "220px",
              top: "72%",
              left: "50%",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
            }}
          />
        </Box>

        {/* Background circles for images */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: (theme) => theme.zIndex.introForegroundImages - 1,
            pointerEvents: "none",
          }}
        >
          {/* Background circle for Image 7 */}
          <Box
            sx={{
              position: "absolute",
              width: "270px",
              height: "270px",
              top: "calc(20% - 10px)",
              left: "calc(55% - 10px)",
              borderRadius: "50%",
              backgroundColor: "rgba(42, 82, 135, 0.2)",
            }}
          />
          {/* Background circle for Image 12 */}
          <Box
            sx={{
              position: "absolute",
              width: "220px",
              height: "220px",
              top: "calc(15% - 10px)",
              left: "calc(80% - 10px)",
              borderRadius: "50%",
              backgroundColor: "rgba(42, 82, 135, 0.2)",
            }}
          />
          {/* Background circle for Image 9 */}
          <Box
            sx={{
              position: "absolute",
              width: "300px",
              height: "300px",
              top: "calc(50% - 10px)",
              left: "calc(75% - 10px)",
              borderRadius: "50%",
              backgroundColor: "rgba(42, 82, 135, 0.2)",
            }}
          />
          {/* Background circle for Image 14 */}
          <Box
            sx={{
              position: "absolute",
              width: "320px",
              height: "320px",
              top: "calc(55% - 10px)",
              left: "calc(50% - 10px)",
              borderRadius: "50%",
              backgroundColor: "rgba(42, 82, 135, 0.2)",
            }}
          />
          {/* Background circle for Image 5 */}
          <Box
            sx={{
              position: "absolute",
              width: "240px",
              height: "240px",
              top: "calc(35% - 10px)",
              left: "calc(85% - 10px)",
              borderRadius: "50%",
              backgroundColor: "rgba(42, 82, 135, 0.2)",
            }}
          />
          {/* Background circle for Image 11 */}
          <Box
            sx={{
              position: "absolute",
              width: "260px",
              height: "260px",
              top: "calc(40% - 10px)",
              left: "calc(45% - 10px)",
              borderRadius: "50%",
              backgroundColor: "rgba(42, 82, 135, 0.2)",
            }}
          />
        </Box>

        {/* Circular crop images collage - 7 selected images */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: (theme) => theme.zIndex.introForegroundImages,
            pointerEvents: "none",
          }}
        >
          {/* Image 7 - Top left of cluster */}
          <Box
            component="img"
            src="/images/circular-crops/7.png"
            sx={{
              position: "absolute",
              width: "250px",
              height: "250px",
              top: "20%",
              left: "55%",
              borderRadius: "50%",
            }}
          />
          {/* Image 12 - Top right of cluster */}
          <Box
            component="img"
            src="/images/circular-crops/12.png"
            sx={{
              position: "absolute",
              width: "200px",
              height: "200px",
              top: "15%",
              left: "80%",
              borderRadius: "50%",
            }}
          />
          {/* Image 9 - Bottom right of cluster */}
          <Box
            component="img"
            src="/images/circular-crops/9.png"
            sx={{
              position: "absolute",
              width: "280px",
              height: "280px",
              top: "50%",
              left: "75%",
              borderRadius: "50%",
            }}
          />
          {/* Image 14 - Bottom left of cluster */}
          <Box
            component="img"
            src="/images/circular-crops/14.png"
            sx={{
              position: "absolute",
              width: "300px",
              height: "300px",
              top: "55%",
              left: "50%",
              borderRadius: "50%",
            }}
          />
          {/* Image 5 - Right side of cluster */}
          <Box
            component="img"
            src="/images/circular-crops/5.png"
            sx={{
              position: "absolute",
              width: "220px",
              height: "220px",
              top: "35%",
              left: "85%",
              borderRadius: "50%",
            }}
          />
          {/* Image 11 - Left side of cluster */}
          <Box
            component="img"
            src="/images/circular-crops/11.png"
            sx={{
              position: "absolute",
              width: "240px",
              height: "240px",
              top: "40%",
              left: "45%",
              borderRadius: "50%",
            }}
          />
        </Box>

        {/* Background circle for Image 3 */}
        <Box
          sx={{
            position: "absolute",
            width: "340px",
            height: "340px",
            top: "calc(30% - 10px)",
            left: "calc(60% - 10px)",
            borderRadius: "50%",
            backgroundColor: "rgba(42, 82, 135, 0.2)",
            zIndex: (theme) => theme.zIndex.introForegroundImages,
          }}
        />

        {/* Image 3 - Center cluster (on top of all others) */}
        <Box
          component="img"
          src="/images/circular-crops/3.png"
          sx={{
            position: "absolute",
            width: "320px",
            height: "320px",
            top: "30%",
            left: "60%",
            borderRadius: "50%",
            zIndex: (theme) => theme.zIndex.introForegroundImages + 1,
          }}
        />

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
                mb: 2
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
                maxWidth: { xs: "600px", md: "520px" },
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
                width: { xs: "600px", md: "520px" },
                display: "flex",
                justifyContent: "center",
                mt: 4,
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
