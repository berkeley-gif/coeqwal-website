/**
 * Result Summary Briefs — by LOI
 *
 * Maps each key-outcome-summary HTML page (in
 * public/documents/Result_Summary/) to a stable id and human-readable
 * label, so the UI never has to expose a raw filename or url slug. Each HTML
 * page links to its underlying PDF, which lives in the
 * Result_Summary/pdf/ subfolder.
 *
 * These briefs summarize outcome level results grouped by LOI — they
 * are not resolved against the scenario API/hooks, so no
 * scenario_id/short_code mapping is involved here.
 *
 * To add a new result summary brief: drop the HTML file in that folder and
 * add one entry below.
 */

import type { ResultSummaryDocument } from "./resultSummaryStrategy"

/** Base path (under public/) where result summary pages are served from. */
const RESULT_SUMMARY_LOI_DOCS_PATH = "/documents/Locations_of_Interest"

export const RESULT_SUMMARY_LOI_DOCUMENTS: ResultSummaryDocument[] = [
  {
    id: "02",
    label: "02",
    file: "loi_brief_02.html",
  },
  {
    id: "02_NA",
    label: "02_NA",
    file: "loi_brief_02_NA.html",
  },
  {
    id: "02_PA",
    label: "02_PA",
    file: "loi_brief_02_PA.html",
  },
  {
    id: "02_PU",
    label: "02_PU",
    file: "loi_brief_02_PU.html",
  },
  {
    id: "02_SA",
    label: "02_SA",
    file: "loi_brief_02_SA.html",
  },
  {
    id: "02_SU",
    label: "02_SU",
    file: "loi_brief_02_SU.html",
  },
  {
    id: "03",
    label: "03",
    file: "loi_brief_03.html",
  },
  {
    id: "03_NA",
    label: "03_NA",
    file: "loi_brief_03_NA.html",
  },
  {
    id: "03_PA",
    label: "03_PA",
    file: "loi_brief_03_PA.html",
  },
  {
    id: "03_PU1",
    label: "03_PU1",
    file: "loi_brief_03_PU1.html",
  },
  {
    id: "03_PU2",
    label: "03_PU2",
    file: "loi_brief_03_PU2.html",
  },
  {
    id: "03_SA",
    label: "03_SA",
    file: "loi_brief_03_SA.html",
  },
  {
    id: "03_SU",
    label: "03_SU",
    file: "loi_brief_03_SU.html",
  },
  {
    id: "04",
    label: "04",
    file: "loi_brief_04.html",
  },
  {
    id: "04_NA",
    label: "04_NA",
    file: "loi_brief_04_NA.html",
  },
  {
    id: "04_PA1",
    label: "04_PA1",
    file: "loi_brief_04_PA1.html",
  },
  {
    id: "04_PA2",
    label: "04_PA2",
    file: "loi_brief_04_PA2.html",
  },
  {
    id: "05",
    label: "05",
    file: "loi_brief_05.html",
  },
  {
    id: "05_NA",
    label: "05_NA",
    file: "loi_brief_05_NA.html",
  },
  {
    id: "06",
    label: "06",
    file: "loi_brief_06.html",
  },
  {
    id: "06_NA",
    label: "06_NA",
    file: "loi_brief_06_NA.html",
  },
  {
    id: "06_PA",
    label: "06_PA",
    file: "loi_brief_06_PA.html",
  },
  {
    id: "07N",
    label: "07N",
    file: "loi_brief_07N.html",
  },
  {
    id: "07N_NA",
    label: "07N_NA",
    file: "loi_brief_07N_NA.html",
  },
  {
    id: "07N_PA",
    label: "07N_PA",
    file: "loi_brief_07N_PA.html",
  },
  {
    id: "07S",
    label: "07S",
    file: "loi_brief_07S.html",
  },
  {
    id: "07S_NA",
    label: "07S_NA",
    file: "loi_brief_07S_NA.html",
  },
  {
    id: "07S_PA",
    label: "07S_PA",
    file: "loi_brief_07S_PA.html",
  },
  {
    id: "08N",
    label: "08N",
    file: "loi_brief_08N.html",
  },
  {
    id: "08N_NA",
    label: "08N_NA",
    file: "loi_brief_08N_NA.html",
  },
  {
    id: "08N_PA",
    label: "08N_PA",
    file: "loi_brief_08N_PA.html",
  },
  {
    id: "08N_SA1",
    label: "08N_SA1",
    file: "loi_brief_08N_SA1.html",
  },
  {
    id: "08N_SA2",
    label: "08N_SA2",
    file: "loi_brief_08N_SA2.html",
  },
  {
    id: "08S",
    label: "08S",
    file: "loi_brief_08S.html",
  },
  {
    id: "08S_NA1",
    label: "08S_NA1",
    file: "loi_brief_08S_NA1.html",
  },
  {
    id: "08S_NA2",
    label: "08S_NA2",
    file: "loi_brief_08S_NA2.html",
  },
  {
    id: "08S_PA",
    label: "08S_PA",
    file: "loi_brief_08S_PA.html",
  },
  {
    id: "08S_SA1",
    label: "08S_SA1",
    file: "loi_brief_08S_SA1.html",
  },
  {
    id: "08S_SA2",
    label: "08S_SA2",
    file: "loi_brief_08S_SA2.html",
  },
  {
    id: "08S_SA3",
    label: "08S_SA3",
    file: "loi_brief_08S_SA3.html",
  },
  {
    id: "09",
    label: "09",
    file: "loi_brief_09.html",
  },
  {
    id: "09_NA",
    label: "09_NA",
    file: "loi_brief_09_NA.html",
  },
  {
    id: "09_SA1",
    label: "09_SA1",
    file: "loi_brief_09_SA1.html",
  },
  {
    id: "09_SA2",
    label: "09_SA2",
    file: "loi_brief_09_SA2.html",
  },
  {
    id: "10",
    label: "10",
    file: "loi_brief_10.html",
  },
  {
    id: "10_NA",
    label: "10_NA",
    file: "loi_brief_10_NA.html",
  },
  {
    id: "11",
    label: "11",
    file: "loi_brief_11.html",
  },
  {
    id: "11_NA",
    label: "11_NA",
    file: "loi_brief_11_NA.html",
  },
  {
    id: "11_NU1",
    label: "11_NU1",
    file: "loi_brief_11_NU1.html",
  },
  {
    id: "11_SA1",
    label: "11_SA1",
    file: "loi_brief_11_SA1.html",
  },
  {
    id: "11_SA2",
    label: "11_SA2",
    file: "loi_brief_11_SA2.html",
  },
  {
    id: "11_SA3",
    label: "11_SA3",
    file: "loi_brief_11_SA3.html",
  },
  {
    id: "11_SA4",
    label: "11_SA4",
    file: "loi_brief_11_SA4.html",
  },
  {
    id: "12",
    label: "12",
    file: "loi_brief_12.html",
  },
  {
    id: "12_NA",
    label: "12_NA",
    file: "loi_brief_12_NA.html",
  },
  {
    id: "12_NU1",
    label: "12_NU1",
    file: "loi_brief_12_NU1.html",
  },
  {
    id: "12_SA",
    label: "12_SA",
    file: "loi_brief_12_SA.html",
  },
  {
    id: "13",
    label: "13",
    file: "loi_brief_13.html",
  },
  {
    id: "13_NA",
    label: "13_NA",
    file: "loi_brief_13_NA.html",
  },
  {
    id: "13_NU1",
    label: "13_NU1",
    file: "loi_brief_13_NU1.html",
  },
  {
    id: "14",
    label: "14",
    file: "loi_brief_14.html",
  },
  {
    id: "14_NA",
    label: "14_NA",
    file: "loi_brief_14_NA.html",
  },
  {
    id: "15N",
    label: "15N",
    file: "loi_brief_15N.html",
  },
  {
    id: "15N_NA1",
    label: "15N_NA1",
    file: "loi_brief_15N_NA1.html",
  },
  {
    id: "15N_NA2",
    label: "15N_NA2",
    file: "loi_brief_15N_NA2.html",
  },
  {
    id: "15N_SA",
    label: "15N_SA",
    file: "loi_brief_15N_SA.html",
  },
  {
    id: "15S",
    label: "15S",
    file: "loi_brief_15S.html",
  },
  {
    id: "15S_NA1",
    label: "15S_NA1",
    file: "loi_brief_15S_NA1.html",
  },
  {
    id: "15S_NA2",
    label: "15S_NA2",
    file: "loi_brief_15S_NA2.html",
  },
  {
    id: "15S_SA",
    label: "15S_SA",
    file: "loi_brief_15S_SA.html",
  },
  {
    id: "16",
    label: "16",
    file: "loi_brief_16.html",
  },
  {
    id: "16_NA1",
    label: "16_NA1",
    file: "loi_brief_16_NA1.html",
  },
  {
    id: "16_NA2",
    label: "16_NA2",
    file: "loi_brief_16_NA2.html",
  },
  {
    id: "16_PA",
    label: "16_PA",
    file: "loi_brief_16_PA.html",
  },
  {
    id: "16_PU",
    label: "16_PU",
    file: "loi_brief_16_PU.html",
  },
  {
    id: "16_SA",
    label: "16_SA",
    file: "loi_brief_16_SA.html",
  },
  {
    id: "17N",
    label: "17N",
    file: "loi_brief_17N.html",
  },
  {
    id: "17N_NA",
    label: "17N_NA",
    file: "loi_brief_17N_NA.html",
  },
  {
    id: "17S",
    label: "17S",
    file: "loi_brief_17S.html",
  },
  {
    id: "17S_NA",
    label: "17S_NA",
    file: "loi_brief_17S_NA.html",
  },
  {
    id: "17S_SA",
    label: "17S_SA",
    file: "loi_brief_17S_SA.html",
  },
  {
    id: "18",
    label: "18",
    file: "loi_brief_18.html",
  },
  {
    id: "18_NA",
    label: "18_NA",
    file: "loi_brief_18_NA.html",
  },
  {
    id: "18_SA",
    label: "18_SA",
    file: "loi_brief_18_SA.html",
  },
  {
    id: "19",
    label: "19",
    file: "loi_brief_19.html",
  },
  {
    id: "19_SA",
    label: "19_SA",
    file: "loi_brief_19_SA.html",
  },
  {
    id: "20",
    label: "20",
    file: "loi_brief_20.html",
  },
  {
    id: "20_NA1",
    label: "20_NA1",
    file: "loi_brief_20_NA1.html",
  },
  {
    id: "20_NA2",
    label: "20_NA2",
    file: "loi_brief_20_NA2.html",
  },
  {
    id: "20_NU1",
    label: "20_NU1",
    file: "loi_brief_20_NU1.html",
  },
  {
    id: "20_PA",
    label: "20_PA",
    file: "loi_brief_20_PA.html",
  },
  {
    id: "21",
    label: "21",
    file: "loi_brief_21.html",
  },
  {
    id: "21_NA",
    label: "21_NA",
    file: "loi_brief_21_NA.html",
  },
  {
    id: "21_PA",
    label: "21_PA",
    file: "loi_brief_21_PA.html",
  },
  {
    id: "21_PU",
    label: "21_PU",
    file: "loi_brief_21_PU.html",
  },
  {
    id: "21_SA",
    label: "21_SA",
    file: "loi_brief_21_SA.html",
  },
  {
    id: "22",
    label: "22",
    file: "loi_brief_22.html",
  },
  {
    id: "22_NA",
    label: "22_NA",
    file: "loi_brief_22_NA.html",
  },
  {
    id: "22_SA1",
    label: "22_SA1",
    file: "loi_brief_22_SA1.html",
  },
  {
    id: "22_SA2",
    label: "22_SA2",
    file: "loi_brief_22_SA2.html",
  },
  {
    id: "23",
    label: "23",
    file: "loi_brief_23.html",
  },
  {
    id: "23_NA",
    label: "23_NA",
    file: "loi_brief_23_NA.html",
  },
  {
    id: "24",
    label: "24",
    file: "loi_brief_24.html",
  },
  {
    id: "24_NA1",
    label: "24_NA1",
    file: "loi_brief_24_NA1.html",
  },
  {
    id: "24_NA2",
    label: "24_NA2",
    file: "loi_brief_24_NA2.html",
  },
  {
    id: "24_NA3",
    label: "24_NA3",
    file: "loi_brief_24_NA3.html",
  },
  {
    id: "24_NU1",
    label: "24_NU1",
    file: "loi_brief_24_NU1.html",
  },
  {
    id: "24_NU2",
    label: "24_NU2",
    file: "loi_brief_24_NU2.html",
  },
  {
    id: "24_NU3",
    label: "24_NU3",
    file: "loi_brief_24_NU3.html",
  },
  {
    id: "25",
    label: "25",
    file: "loi_brief_25.html",
  },
  {
    id: "25_NA",
    label: "25_NA",
    file: "loi_brief_25_NA.html",
  },
  {
    id: "25_PA1",
    label: "25_PA1",
    file: "loi_brief_25_PA1.html",
  },
  {
    id: "25_PA2",
    label: "25_PA2",
    file: "loi_brief_25_PA2.html",
  },
  {
    id: "25_PU",
    label: "25_PU",
    file: "loi_brief_25_PU.html",
  },
  {
    id: "26N",
    label: "26N",
    file: "loi_brief_26N.html",
  },
  {
    id: "26N_NA",
    label: "26N_NA",
    file: "loi_brief_26N_NA.html",
  },
  {
    id: "26N_NU1",
    label: "26N_NU1",
    file: "loi_brief_26N_NU1.html",
  },
  {
    id: "26N_NU2",
    label: "26N_NU2",
    file: "loi_brief_26N_NU2.html",
  },
  {
    id: "26N_NU3",
    label: "26N_NU3",
    file: "loi_brief_26N_NU3.html",
  },
  {
    id: "26N_PU1",
    label: "26N_PU1",
    file: "loi_brief_26N_PU1.html",
  },
  {
    id: "26N_PU2",
    label: "26N_PU2",
    file: "loi_brief_26N_PU2.html",
  },
  {
    id: "26N_PU3",
    label: "26N_PU3",
    file: "loi_brief_26N_PU3.html",
  },
  {
    id: "26S",
    label: "26S",
    file: "loi_brief_26S.html",
  },
  {
    id: "26S_NA",
    label: "26S_NA",
    file: "loi_brief_26S_NA.html",
  },
  {
    id: "26S_NU1",
    label: "26S_NU1",
    file: "loi_brief_26S_NU1.html",
  },
  {
    id: "26S_PU1",
    label: "26S_PU1",
    file: "loi_brief_26S_PU1.html",
  },
  {
    id: "26S_PU2",
    label: "26S_PU2",
    file: "loi_brief_26S_PU2.html",
  },
  {
    id: "26S_PU4",
    label: "26S_PU4",
    file: "loi_brief_26S_PU4.html",
  },
  {
    id: "26S_PU5",
    label: "26S_PU5",
    file: "loi_brief_26S_PU5.html",
  },
  {
    id: "26S_PU6",
    label: "26S_PU6",
    file: "loi_brief_26S_PU6.html",
  },
  {
    id: "50",
    label: "50",
    file: "loi_brief_50.html",
  },
  {
    id: "50_PA1",
    label: "50_PA1",
    file: "loi_brief_50_PA1.html",
  },
  {
    id: "50_PA2",
    label: "50_PA2",
    file: "loi_brief_50_PA2.html",
  },
  {
    id: "50_PU",
    label: "50_PU",
    file: "loi_brief_50_PU.html",
  },
  {
    id: "60N",
    label: "60N",
    file: "loi_brief_60N.html",
  },
  {
    id: "60N_NA1",
    label: "60N_NA1",
    file: "loi_brief_60N_NA1.html",
  },
  {
    id: "60N_NA2",
    label: "60N_NA2",
    file: "loi_brief_60N_NA2.html",
  },
  {
    id: "60N_NA3",
    label: "60N_NA3",
    file: "loi_brief_60N_NA3.html",
  },
  {
    id: "60N_NA4",
    label: "60N_NA4",
    file: "loi_brief_60N_NA4.html",
  },
  {
    id: "60N_NA5",
    label: "60N_NA5",
    file: "loi_brief_60N_NA5.html",
  },
  {
    id: "60N_NU2",
    label: "60N_NU2",
    file: "loi_brief_60N_NU2.html",
  },
  {
    id: "60S",
    label: "60S",
    file: "loi_brief_60S.html",
  },
  {
    id: "60S_NA1",
    label: "60S_NA1",
    file: "loi_brief_60S_NA1.html",
  },
  {
    id: "60S_NA2",
    label: "60S_NA2",
    file: "loi_brief_60S_NA2.html",
  },
  {
    id: "60S_NU1",
    label: "60S_NU1",
    file: "loi_brief_60S_NU1.html",
  },
  {
    id: "60S_PA1",
    label: "60S_PA1",
    file: "loi_brief_60S_PA1.html",
  },
  {
    id: "60S_PA2",
    label: "60S_PA2",
    file: "loi_brief_60S_PA2.html",
  },
  {
    id: "61",
    label: "61",
    file: "loi_brief_61.html",
  },
  {
    id: "61_NA1",
    label: "61_NA1",
    file: "loi_brief_61_NA1.html",
  },
  {
    id: "61_NA2",
    label: "61_NA2",
    file: "loi_brief_61_NA2.html",
  },
  {
    id: "61_NA3",
    label: "61_NA3",
    file: "loi_brief_61_NA3.html",
  },
  {
    id: "61_NA4",
    label: "61_NA4",
    file: "loi_brief_61_NA4.html",
  },
  {
    id: "61_NA5",
    label: "61_NA5",
    file: "loi_brief_61_NA5.html",
  },
  {
    id: "61_NA6",
    label: "61_NA6",
    file: "loi_brief_61_NA6.html",
  },
  {
    id: "61_NU2",
    label: "61_NU2",
    file: "loi_brief_61_NU2.html",
  },
  {
    id: "61_PA1",
    label: "61_PA1",
    file: "loi_brief_61_PA1.html",
  },
  {
    id: "61_PA2",
    label: "61_PA2",
    file: "loi_brief_61_PA2.html",
  },
  {
    id: "61_PA3",
    label: "61_PA3",
    file: "loi_brief_61_PA3.html",
  },
  {
    id: "62",
    label: "62",
    file: "loi_brief_62.html",
  },
  {
    id: "62_NA1",
    label: "62_NA1",
    file: "loi_brief_62_NA1.html",
  },
  {
    id: "62_NA2",
    label: "62_NA2",
    file: "loi_brief_62_NA2.html",
  },
  {
    id: "62_NA3",
    label: "62_NA3",
    file: "loi_brief_62_NA3.html",
  },
  {
    id: "62_NA4",
    label: "62_NA4",
    file: "loi_brief_62_NA4.html",
  },
  {
    id: "62_NA5",
    label: "62_NA5",
    file: "loi_brief_62_NA5.html",
  },
  {
    id: "62_NA6",
    label: "62_NA6",
    file: "loi_brief_62_NA6.html",
  },
  {
    id: "63",
    label: "63",
    file: "loi_brief_63.html",
  },
  {
    id: "63_NA1",
    label: "63_NA1",
    file: "loi_brief_63_NA1.html",
  },
  {
    id: "63_NA2",
    label: "63_NA2",
    file: "loi_brief_63_NA2.html",
  },
  {
    id: "63_NA3",
    label: "63_NA3",
    file: "loi_brief_63_NA3.html",
  },
  {
    id: "63_NA4",
    label: "63_NA4",
    file: "loi_brief_63_NA4.html",
  },
  {
    id: "64",
    label: "64",
    file: "loi_brief_64.html",
  },
  {
    id: "64_NA1",
    label: "64_NA1",
    file: "loi_brief_64_NA1.html",
  },
  {
    id: "64_NA2",
    label: "64_NA2",
    file: "loi_brief_64_NA2.html",
  },
  {
    id: "64_PA1",
    label: "64_PA1",
    file: "loi_brief_64_PA1.html",
  },
  {
    id: "64_PA2",
    label: "64_PA2",
    file: "loi_brief_64_PA2.html",
  },
  {
    id: "64_PA3",
    label: "64_PA3",
    file: "loi_brief_64_PA3.html",
  },
  {
    id: "64_XA",
    label: "64_XA",
    file: "loi_brief_64_XA.html",
  },
  {
    id: "71",
    label: "71",
    file: "loi_brief_71.html",
  },
  {
    id: "71_NA1",
    label: "71_NA1",
    file: "loi_brief_71_NA1.html",
  },
  {
    id: "71_NA2",
    label: "71_NA2",
    file: "loi_brief_71_NA2.html",
  },
  {
    id: "71_PA1",
    label: "71_PA1",
    file: "loi_brief_71_PA1.html",
  },
  {
    id: "71_PA2",
    label: "71_PA2",
    file: "loi_brief_71_PA2.html",
  },
  {
    id: "71_PA3",
    label: "71_PA3",
    file: "loi_brief_71_PA3.html",
  },
  {
    id: "71_PA4",
    label: "71_PA4",
    file: "loi_brief_71_PA4.html",
  },
  {
    id: "71_PA5",
    label: "71_PA5",
    file: "loi_brief_71_PA5.html",
  },
  {
    id: "71_PA6",
    label: "71_PA6",
    file: "loi_brief_71_PA6.html",
  },
  {
    id: "71_PA7",
    label: "71_PA7",
    file: "loi_brief_71_PA7.html",
  },
  {
    id: "71_PA8",
    label: "71_PA8",
    file: "loi_brief_71_PA8.html",
  },
  {
    id: "72",
    label: "72",
    file: "loi_brief_72.html",
  },
  {
    id: "72_NA1",
    label: "72_NA1",
    file: "loi_brief_72_NA1.html",
  },
  {
    id: "72_NA2",
    label: "72_NA2",
    file: "loi_brief_72_NA2.html",
  },
  {
    id: "72_PA",
    label: "72_PA",
    file: "loi_brief_72_PA.html",
  },
  {
    id: "72_XA1",
    label: "72_XA1",
    file: "loi_brief_72_XA1.html",
  },
  {
    id: "72_XA2",
    label: "72_XA2",
    file: "loi_brief_72_XA2.html",
  },
  {
    id: "72_XA3",
    label: "72_XA3",
    file: "loi_brief_72_XA3.html",
  },
  {
    id: "73",
    label: "73",
    file: "loi_brief_73.html",
  },
  {
    id: "73_NA",
    label: "73_NA",
    file: "loi_brief_73_NA.html",
  },
  {
    id: "73_PA1",
    label: "73_PA1",
    file: "loi_brief_73_PA1.html",
  },
  {
    id: "73_PA2",
    label: "73_PA2",
    file: "loi_brief_73_PA2.html",
  },
  {
    id: "73_PA3",
    label: "73_PA3",
    file: "loi_brief_73_PA3.html",
  },
  {
    id: "73_XA",
    label: "73_XA",
    file: "loi_brief_73_XA.html",
  },
  {
    id: "90",
    label: "90",
    file: "loi_brief_90.html",
  },
  {
    id: "90_PA1",
    label: "90_PA1",
    file: "loi_brief_90_PA1.html",
  },
  {
    id: "90_PA2",
    label: "90_PA2",
    file: "loi_brief_90_PA2.html",
  },
  {
    id: "90_PU",
    label: "90_PU",
    file: "loi_brief_90_PU.html",
  },
  {
    id: "ACFC",
    label: "ACFC",
    file: "loi_brief_ACFC.html",
  },
  {
    id: "AMADR",
    label: "AMADR",
    file: "loi_brief_AMADR.html",
  },
  {
    id: "AMCYN",
    label: "AMCYN",
    file: "loi_brief_AMCYN.html",
  },
  {
    id: "AMR004",
    label: "AMR004",
    file: "loi_brief_AMR004.html",
  },
  {
    id: "ANTOC",
    label: "ANTOC",
    file: "loi_brief_ANTOC.html",
  },
  {
    id: "BNCIA",
    label: "BNCIA",
    file: "loi_brief_BNCIA.html",
  },
  {
    id: "CAA003",
    label: "CAA003",
    file: "loi_brief_CAA003.html",
  },
  {
    id: "CCWD",
    label: "CCWD",
    file: "loi_brief_CCWD.html",
  },
  {
    id: "CSB038",
    label: "CSB038",
    file: "loi_brief_CSB038.html",
  },
  {
    id: "CSB103",
    label: "CSB103",
    file: "loi_brief_CSB103.html",
  },
  {
    id: "CSPSO",
    label: "CSPSO",
    file: "loi_brief_CSPSO.html",
  },
  {
    id: "DETAW_DELTA_ECO",
    label: "DETAW_DELTA_ECO",
    file: "loi_brief_DETAW_DELTA_ECO.html",
  },
  {
    id: "DETAW_GW_STOR",
    label: "DETAW_GW_STOR",
    file: "loi_brief_DETAW_GW_STOR.html",
  },
  {
    id: "DMC000",
    label: "DMC000",
    file: "loi_brief_DMC000.html",
  },
  {
    id: "EBMUD",
    label: "EBMUD",
    file: "loi_brief_EBMUD.html",
  },
  {
    id: "ELDID_NU1",
    label: "ELDID_NU1",
    file: "loi_brief_ELDID_NU1.html",
  },
  {
    id: "ELDID_NU2",
    label: "ELDID_NU2",
    file: "loi_brief_ELDID_NU2.html",
  },
  {
    id: "ELDID_NU3",
    label: "ELDID_NU3",
    file: "loi_brief_ELDID_NU3.html",
  },
  {
    id: "EM",
    label: "EM",
    file: "loi_brief_EM.html",
  },
  {
    id: "ESB324",
    label: "ESB324",
    file: "loi_brief_ESB324.html",
  },
  {
    id: "ESB347",
    label: "ESB347",
    file: "loi_brief_ESB347.html",
  },
  {
    id: "ESB355",
    label: "ESB355",
    file: "loi_brief_ESB355.html",
  },
  {
    id: "ESB414",
    label: "ESB414",
    file: "loi_brief_ESB414.html",
  },
  {
    id: "ESB420",
    label: "ESB420",
    file: "loi_brief_ESB420.html",
  },
  {
    id: "FOLSM",
    label: "FOLSM",
    file: "loi_brief_FOLSM.html",
  },
  {
    id: "FRFLD",
    label: "FRFLD",
    file: "loi_brief_FRFLD.html",
  },
  {
    id: "FTR003",
    label: "FTR003",
    file: "loi_brief_FTR003.html",
  },
  {
    id: "FTR029",
    label: "FTR029",
    file: "loi_brief_FTR029.html",
  },
  {
    id: "GDPUD_NU",
    label: "GDPUD_NU",
    file: "loi_brief_GDPUD_NU.html",
  },
  {
    id: "GRSVL",
    label: "GRSVL",
    file: "loi_brief_GRSVL.html",
  },
  {
    id: "JLIND",
    label: "JLIND",
    file: "loi_brief_JLIND.html",
  },
  {
    id: "JP",
    label: "JP",
    file: "loi_brief_JP.html",
  },
  {
    id: "KCWA",
    label: "KCWA",
    file: "loi_brief_KCWA.html",
  },
  {
    id: "MCD005",
    label: "MCD005",
    file: "loi_brief_MCD005.html",
  },
  {
    id: "MELON",
    label: "MELON",
    file: "loi_brief_MELON.html",
  },
  {
    id: "MHILL_NU",
    label: "MHILL_NU",
    file: "loi_brief_MHILL_NU.html",
  },
  {
    id: "MLRTN",
    label: "MLRTN",
    file: "loi_brief_MLRTN.html",
  },
  {
    id: "MOK028",
    label: "MOK028",
    file: "loi_brief_MOK028.html",
  },
  {
    id: "MWD",
    label: "MWD",
    file: "loi_brief_MWD.html",
  },
  {
    id: "NAPA",
    label: "NAPA",
    file: "loi_brief_NAPA.html",
  },
  {
    id: "NAPA2",
    label: "NAPA2",
    file: "loi_brief_NAPA2.html",
  },
  {
    id: "OROVL",
    label: "OROVL",
    file: "loi_brief_OROVL.html",
  },
  {
    id: "PCWA3",
    label: "PCWA3",
    file: "loi_brief_PCWA3.html",
  },
  {
    id: "PLMAS",
    label: "PLMAS",
    file: "loi_brief_PLMAS.html",
  },
  {
    id: "SAC000",
    label: "SAC000",
    file: "loi_brief_SAC000.html",
  },
  {
    id: "SAC049",
    label: "SAC049",
    file: "loi_brief_SAC049.html",
  },
  {
    id: "SAC122",
    label: "SAC122",
    file: "loi_brief_SAC122.html",
  },
  {
    id: "SAC148",
    label: "SAC148",
    file: "loi_brief_SAC148.html",
  },
  {
    id: "SAC257",
    label: "SAC257",
    file: "loi_brief_SAC257.html",
  },
  {
    id: "SAC289",
    label: "SAC289",
    file: "loi_brief_SAC289.html",
  },
  {
    id: "SAC299",
    label: "SAC299",
    file: "loi_brief_SAC299.html",
  },
  {
    id: "SBA029",
    label: "SBA029",
    file: "loi_brief_SBA029.html",
  },
  {
    id: "SBA036",
    label: "SBA036",
    file: "loi_brief_SBA036.html",
  },
  {
    id: "SBCWD",
    label: "SBCWD",
    file: "loi_brief_SBCWD.html",
  },
  {
    id: "SCVWD",
    label: "SCVWD",
    file: "loi_brief_SCVWD.html",
  },
  {
    id: "SHSTA",
    label: "SHSTA",
    file: "loi_brief_SHSTA.html",
  },
  {
    id: "SJR070",
    label: "SJR070",
    file: "loi_brief_SJR070.html",
  },
  {
    id: "SJR127",
    label: "SJR127",
    file: "loi_brief_SJR127.html",
  },
  {
    id: "SLUIS_CVP",
    label: "SLUIS_CVP",
    file: "loi_brief_SLUIS_CVP.html",
  },
  {
    id: "SLUIS_SWP",
    label: "SLUIS_SWP",
    file: "loi_brief_SLUIS_SWP.html",
  },
  {
    id: "STS011",
    label: "STS011",
    file: "loi_brief_STS011.html",
  },
  {
    id: "SUISN",
    label: "SUISN",
    file: "loi_brief_SUISN.html",
  },
  {
    id: "SVWRD",
    label: "SVWRD",
    file: "loi_brief_SVWRD.html",
  },
  {
    id: "TLMNE",
    label: "TLMNE",
    file: "loi_brief_TLMNE.html",
  },
  {
    id: "TRN111",
    label: "TRN111",
    file: "loi_brief_TRN111.html",
  },
  {
    id: "TRNTY",
    label: "TRNTY",
    file: "loi_brief_TRNTY.html",
  },
  {
    id: "TUO003",
    label: "TUO003",
    file: "loi_brief_TUO003.html",
  },
  {
    id: "TVAFB",
    label: "TVAFB",
    file: "loi_brief_TVAFB.html",
  },
  {
    id: "UNION",
    label: "UNION",
    file: "loi_brief_UNION.html",
  },
  {
    id: "UPANG",
    label: "UPANG",
    file: "loi_brief_UPANG.html",
  },
  {
    id: "VLLJO",
    label: "VLLJO",
    file: "loi_brief_VLLJO.html",
  },
  {
    id: "WLDWD",
    label: "WLDWD",
    file: "loi_brief_WLDWD.html",
  },
  {
    id: "WSB032",
    label: "WSB032",
    file: "loi_brief_WSB032.html",
  },
  {
    id: "YUB002",
    label: "YUB002",
    file: "loi_brief_YUB002.html",
  },
]

/** Resolve a result summary document's public URL from its filename. */
export function getResultSummaryLOIDocumentUrl(file: string): string {
  return `${RESULT_SUMMARY_LOI_DOCS_PATH}/${file}`
}

/** Look up a result summary document by its stable id. */
export function getResultSummaryLOIDocumentById(
  id: string,
): ResultSummaryDocument | undefined {
  return RESULT_SUMMARY_LOI_DOCUMENTS.find((doc) => doc.id === id)
}
