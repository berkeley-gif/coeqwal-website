import { createTheme } from '@mui/material/styles'
import { Geist, Geist_Mono } from "next/font/google"
import { Inter } from 'next/font/google'

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
  })

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ['latin'],
    display: 'swap',
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ['latin'],
    display: 'swap',
})

const theme = createTheme({
    palette: {
        common: {
            black: '#000',
            white: '#fff',
        },
        primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0',
        },
        secondary: {
            main: '#dc004e',
        },
        text: {
            primary: '#000',
            secondary: '#666',
        },
        divider: '#e0e0e0',
        background: {
            default: '#1976d2',
            paper: '#fff',
        },
    },
    typography: {
        htmlFontSize: 16,
        fontFamily: `${geistSans.variable}, ${geistMono.variable}, ${inter.style.fontFamily}`,
        fontSize: 14,
        fontWeightLight: 300,
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
        h1: {
            fontWeight: 300,
            fontSize: "6rem",
            lineHeight: 1.167,
            letterSpacing: "-0.01562rem"
        },
        h2: {
            fontWeight: 300,
            fontSize: "3.75rem",
            lineHeight: 1.2,
            letterSpacing: "-0.00833rem"
        },
        h3: {
            fontWeight: 400,
            fontSize: "3rem",
            lineHeight: 1.167,
            letterSpacing: "0rem"
        },
        h4: {
            fontWeight: 400,
            fontSize: "2.125rem",
            lineHeight: 1.235,
            letterSpacing: "0.00735rem"
        },
        h5: {
            fontWeight: 400,
            fontSize: "1.5rem",
            lineHeight: 1.334,
            letterSpacing: "0rem"
        },
        h6: {
            fontWeight: 500,
            fontSize: "1.25rem",
            lineHeight: 1.6,
            letterSpacing: "0.0075rem"
        },
        subtitle1: {
            fontWeight: 400,
            fontSize: "1rem",
            lineHeight: 1.75,
            letterSpacing: "0.00938rem"
        },
        subtitle2: {
            fontWeight: 500,
            fontSize: "0.875rem",
            lineHeight: 1.57,
            letterSpacing: "0.00714rem"
        },
        body1: {
            fontWeight: 400,
            fontSize: "1rem",
            lineHeight: 1.5,
            letterSpacing: "0.00938rem"
        },
        body2: {
            fontWeight: 400,
            fontSize: "0.875rem",
            lineHeight: 1.43,
            letterSpacing: "0.01071rem"
        },
        button: {
            fontWeight: 500,
            fontSize: "0.875rem",
            lineHeight: 1.75,
            letterSpacing: "0.02857rem",
            textTransform: "uppercase"
        },
        caption: {
            fontWeight: 400,
            fontSize: "0.75rem",
            lineHeight: 1.66,
            letterSpacing: "0.03333rem"
        },
    },
    shape: {
        borderRadius: 4,
    },
    zIndex: {
        appBar: 1100,
        drawer: 1200,
        modal: 1300,
        tooltip: 1500,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                },
            },
        },
    },
})

export default theme