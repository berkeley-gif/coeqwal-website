"use client"

/**
 * mui-components - Centralized MUI component re-exports
 *
 * Single entry point for all MUI components used in the application.
 * Import from @repo/ui/mui instead of @mui/material directly.
 */

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
  Tabs,
  Tab,

  // Typography and content
  Typography,
  // MUI Card components exported with "Mui" prefix to avoid conflict with custom Card
  Card as MuiCard,
  CardContent as MuiCardContent,
  CardActionArea as MuiCardActionArea,

  // Inputs and controls
  Button,
  ButtonGroup,
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
  Select,
  FormControl,
  InputLabel,
  InputBase,
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
  Fade,
  Chip,

  // Utility components
  useMediaQuery,
  SvgIcon,
  ClickAwayListener,
  Portal,
} from "@mui/material"

export type { BoxProps } from "@mui/material"
export type { TypographyProps } from "@mui/material/Typography"
export type { ButtonProps } from "@mui/material/Button"
export type { SelectChangeEvent } from "@mui/material/Select"

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
import MenuBookIcon from "@mui/icons-material/MenuBook"
import VisibilityIcon from "@mui/icons-material/Visibility"
import AddIcon from "@mui/icons-material/Add"
import CheckIcon from "@mui/icons-material/Check"
import CloseIcon from "@mui/icons-material/Close"
import ArrowRightIcon from "@mui/icons-material/ArrowRight"
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord"
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import InfoIcon from "@mui/icons-material/Info"
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore"
import MyLocationIcon from "@mui/icons-material/MyLocation"
import EditNoteIcon from "@mui/icons-material/EditNote"
import AgricultureIcon from "@mui/icons-material/Agriculture"
import SetMealIcon from "@mui/icons-material/SetMeal"
import ScienceIcon from "@mui/icons-material/Science"
import WaterDropIcon from "@mui/icons-material/WaterDrop"
import AccountBalanceIcon from "@mui/icons-material/AccountBalance"
import CompareIcon from "@mui/icons-material/Compare"
import Diversity3Icon from "@mui/icons-material/Diversity3"
import LocalShippingIcon from "@mui/icons-material/LocalShipping"
import CloudIcon from "@mui/icons-material/Cloud"
import StorageIcon from "@mui/icons-material/Storage"
import GroupsIcon from "@mui/icons-material/Groups"
import AssessmentIcon from "@mui/icons-material/Assessment"
import CategoryIcon from "@mui/icons-material/Category"
import WavesIcon from "@mui/icons-material/Waves"
import TimelineIcon from "@mui/icons-material/Timeline"
import ViewListIcon from "@mui/icons-material/ViewList"
import MapIcon from "@mui/icons-material/Map"
import CompareArrowsIcon from "@mui/icons-material/CompareArrows"
import HistoryIcon from "@mui/icons-material/History"
import WbSunnyIcon from "@mui/icons-material/WbSunny"
import ThunderstormIcon from "@mui/icons-material/Thunderstorm"
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment"
import SwapVertIcon from "@mui/icons-material/SwapVert"
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward"
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward"

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
  ArrowDropUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  OpacityIcon,
  EngineeringIcon,
  ReportProblemIcon,
  BarChartIcon,
  SlideshowIcon,
  LibraryBooksIcon,
  MenuBookIcon,
  VisibilityIcon,
  AddIcon,
  CheckIcon,
  CloseIcon,
  ArrowRightIcon,
  ArrowForwardIcon,
  FiberManualRecordIcon,
  PlayArrowIcon,
  InfoIcon,
  UnfoldMoreIcon,
  MyLocationIcon,
  EditNoteIcon,
  AgricultureIcon,
  SetMealIcon,
  ScienceIcon,
  WaterDropIcon,
  AccountBalanceIcon,
  CompareIcon,
  Diversity3Icon,
  LocalShippingIcon,
  CloudIcon,
  StorageIcon,
  GroupsIcon,
  AssessmentIcon,
  CategoryIcon,
  WavesIcon,
  TimelineIcon,
  ViewListIcon,
  MapIcon,
  CompareArrowsIcon,
  HistoryIcon,
  WbSunnyIcon,
  ThunderstormIcon,
  LocalFireDepartmentIcon,
  SwapVertIcon,
  ArrowUpwardIcon,
  ArrowDownwardIcon,
}

// Export the full icons library for access to other icons as needed
export * as icons from "@mui/icons-material"

// Styles and themes
export { useTheme, alpha, styled } from "@mui/material/styles"
export type { Theme } from "@mui/material/styles"

// System utilities and types
export type { ResponsiveStyleValue, SxProps } from "@mui/system"
