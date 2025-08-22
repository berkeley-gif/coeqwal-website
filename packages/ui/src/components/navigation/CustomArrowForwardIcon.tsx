import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import { SvgIconProps } from "@mui/material"

const ArrowForwardIconWithMargin = (props: SvgIconProps) => {
  return <ArrowForwardIcon {...props} sx={{ ml: "1rem", ...props.sx }} />
}

export default ArrowForwardIconWithMargin
