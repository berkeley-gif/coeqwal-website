import React from "react"
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import { SvgIconProps } from "@mui/material"

const ArrowForwardIconWithMargin: React.FC<SvgIconProps> = (props) => {
  return <ArrowForwardIcon {...props} sx={{ ml: "1rem", ...props.sx }} />
}

export default ArrowForwardIconWithMargin
