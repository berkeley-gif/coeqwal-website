/**
 * CoordinateStage is now provided by @repo/ui storylines.
 *
 * viewBoxWidth and viewBoxHeight define the design coordinate system shared by
 * SVG layers and HTML overlays. They usually match the SVG viewBox dimensions.
 *
 * @example
 * <CoordinateStage viewBoxWidth={1728} viewBoxHeight={1095} fit="stretch">
 *   <CoordinateSvg>
 *     <path d="..." />
 *   </CoordinateSvg>
 *
 *   <CoordinateBox x={400} y={300} width={980}>
 *     <Paragraph blocks={intro} />
 *   </CoordinateBox>
 *
 *   <CoordinateBox x="40%" y="56%" width="34rem">
 *     <Paragraph blocks={callout} />
 *   </CoordinateBox>
 * </CoordinateStage>
 */
export {
  CoordinateBox,
  CoordinateStage,
  CoordinateSvg,
} from "@repo/ui"
export type {
  CoordinateBoxProps,
  CoordinateStageFit,
  CoordinateStageProps,
  CoordinateSvgProps,
  CoordinateValue,
} from "@repo/ui"
