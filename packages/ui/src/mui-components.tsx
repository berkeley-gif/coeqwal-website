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
  MenuItem,
  Slider,
  List,
  ListItem,
  ListItemText,

  // Feedback components
  Snackbar,
  Alert,
  AlertTitle,
  Tooltip,
  CircularProgress,

  // Utility components
  useMediaQuery,
} from "@mui/material"

export type { BoxProps } from "@mui/material"
export type { TypographyProps } from "@mui/material/Typography"

// Import and re-export specific commonly used icons
import WaterIcon from "@mui/icons-material/Water"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import SwapHorizIcon from "@mui/icons-material/SwapHoriz"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import SearchIcon from "@mui/icons-material/Search"
import LocationOnIcon from "@mui/icons-material/LocationOn"
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp"
import ArrowCircleDownIcon from "@mui/icons-material/ArrowCircleDown"
import HomeIcon from "@mui/icons-material/Home"
import SettingsIcon from "@mui/icons-material/Settings"
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import OpacityIcon from "@mui/icons-material/Opacity"
import EngineeringIcon from "@mui/icons-material/Engineering"
import ReportProblemIcon from "@mui/icons-material/ReportProblem"
import BarChartIcon from "@mui/icons-material/BarChart"
import SlideshowIcon from "@mui/icons-material/Slideshow"
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks"
import VisibilityIcon from "@mui/icons-material/Visibility"
import AddIcon from "@mui/icons-material/Add"
import CheckIcon from "@mui/icons-material/Check"
import CloseIcon from "@mui/icons-material/Close"
import ArrowRightIcon from "@mui/icons-material/ArrowRight"
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord"
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"

// Export individually imported icons
export {
  WaterIcon,
  KeyboardArrowDownIcon,
  HomeIcon,
  LocationOnIcon,
  SearchIcon,
  SettingsIcon,
  SwapHorizIcon,
  ExpandMoreIcon,
  ArrowCircleUpIcon,
  ArrowCircleDownIcon,
  ArrowDropDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  OpacityIcon,
  EngineeringIcon,
  ReportProblemIcon,
  BarChartIcon,
  SlideshowIcon,
  LibraryBooksIcon,
  VisibilityIcon,
  AddIcon,
  CheckIcon,
  CloseIcon,
  ArrowRightIcon,
  FiberManualRecordIcon,
  PlayArrowIcon,
}

// Export the full icons library for access to other icons as needed
export * as icons from "@mui/icons-material"

// Styles and themes
export { useTheme, alpha, styled } from "@mui/material/styles"
export type { Theme } from "@mui/material/styles"
