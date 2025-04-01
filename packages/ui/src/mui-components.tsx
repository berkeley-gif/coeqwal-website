"use client"

// Re-export MUI components so the package is the single MUI entry point
export {
  // Layout components
  Box,
  Container,
  Paper,
  Grid,
  Stack,
  Divider,

  // Navigation components
  AppBar,
  Toolbar,
  Drawer,
  Accordion,
  AccordionSummary,
  AccordionDetails,

  // Typography and content
  Typography,

  // Inputs and controls
  Button,
  ToggleButton,
  ToggleButtonGroup,

  // Form components
  Checkbox,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  IconButton,

  // Feedback components
  Snackbar,
  Alert,
  AlertTitle,
  Tooltip,

  // Utility components
  useMediaQuery,
} from "@mui/material"

// Add imports for icons
import SwapHorizIcon from "@mui/icons-material/SwapHoriz"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import SearchIcon from "@mui/icons-material/Search"
import LocationOnIcon from "@mui/icons-material/LocationOn"
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp"
import ArrowCircleDownIcon from "@mui/icons-material/ArrowCircleDown"
export {
  SwapHorizIcon,
  ExpandMoreIcon,
  SearchIcon,
  LocationOnIcon,
  ArrowCircleUpIcon,
  ArrowCircleDownIcon,
}

// Styles and themes
export { useTheme, alpha, styled } from "@mui/material/styles"
export type { Theme } from "@mui/material/styles"
