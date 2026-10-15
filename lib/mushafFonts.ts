import { ScheherazadeNew_400Regular, ScheherazadeNew_700Bold } from "@expo-google-fonts/scheherazade-new"
import { Lateef_400Regular } from "@expo-google-fonts/lateef"
import { NotoNaskhArabic_400Regular } from "@expo-google-fonts/noto-naskh-arabic"
import { readCachedPremium } from "@/lib/premium"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "mushaf_font"

export type MushafFontId =
  | "scheherazade"
  | "kfgqpc_hafs"
  | "amiri_quran"
  | "scheherazade_bold"
  | "noto_naskh"
  | "lateef"

/**
 * Which encoding of the same Quran text the font is built for. KFGQPC fonts
 * read sukun as U+06E1 and draw U+0652 as the silent-letter circle, so they
 * need quran.com's text_qpc_hafs instead of text_uthmani.
 */
export type MushafTextField = "text_uthmani" | "text_qpc_hafs"

export type MushafFontConfig = {
  id: MushafFontId
  /** Real font name. Shown as the label unless labelKey is set. */
  name: string
  /** i18n key for a friendlier label; the real name is then shown underneath. */
  labelKey?: string
  /** i18n key for a short note under the label. */
  noteKey?: string
  /** expo-font family alias registered in MUSHAF_FONT_ASSETS. */
  family: string
  textField: MushafTextField
  /**
   * Multiplier on the user's mushaf text size. Fonts draw at different
   * optical sizes; these values give roughly the same word widths as
   * Scheherazade New so line breaks stay close to the current layout.
   */
  sizeScale: number
  /** Body line height as a multiple of the scaled font size. */
  lineHeight: number
  /** Bismillah line height as a multiple of the scaled font size. */
  bismillahLineHeight: number
  premium: boolean
}

export const DEFAULT_MUSHAF_FONT_ID: MushafFontId = "kfgqpc_hafs"

export const MUSHAF_FONTS: readonly MushafFontConfig[] = [
  {
    id: "kfgqpc_hafs",
    name: "KFGQPC Uthmanic Script HAFS",
    labelKey: "mushafFontMadinah",
    noteKey: "mushafFontRecommended",
    family: "KFGQPCHafsUthmanicScript",
    textField: "text_qpc_hafs",
    sizeScale: 1.12,
    // Marks reach 1.15em above and 0.53em below the baseline (pages 2 and 421); below 1.74 they clip.
    lineHeight: 1.8,
    bismillahLineHeight: 1.9,
    premium: false,
  },
  {
    id: "scheherazade_bold",
    name: "Scheherazade New",
    noteKey: "mushafFontBold",
    family: "ScheherazadeNew_700Bold",
    textField: "text_uthmani",
    sizeScale: 0.95,
    lineHeight: 1.85,
    bismillahLineHeight: 2.05,
    premium: false,
  },
  {
    id: "amiri_quran",
    name: "Amiri Quran",
    family: "AmiriQuran",
    textField: "text_uthmani",
    sizeScale: 1.1,
    lineHeight: 1.8,
    bismillahLineHeight: 2,
    premium: false,
  },
  {
    id: "scheherazade",
    name: "Scheherazade New",
    noteKey: "mushafFontClassic",
    family: "ScheherazadeNew_400Regular",
    textField: "text_uthmani",
    sizeScale: 1,
    lineHeight: 1.75,
    bismillahLineHeight: 2,
    premium: false,
  },
  // ─── Premium fonts ─────────────────────────────────────────────────────────
  // Sizes are first guesses: check a few pages (2, 421, 604) and tweak sizeScale / lineHeight if words wrap or marks clip.
  {
    id: "noto_naskh",
    name: "Noto Naskh Arabic",
    family: "NotoNaskhArabic_400Regular",
    textField: "text_uthmani",
    sizeScale: 0.92,
    lineHeight: 2,
    bismillahLineHeight: 2.1,
    premium: true,
  },
  {
    id: "lateef",
    name: "Lateef",
    family: "Lateef_400Regular",
    textField: "text_uthmani",
    sizeScale: 1.25,
    lineHeight: 1.7,
    bismillahLineHeight: 1.9,
    premium: true,
  },
]

/** Pass to expo-font useFonts on screens that render the mushaf. */
export const MUSHAF_FONT_ASSETS = {
  ScheherazadeNew_400Regular,
  ScheherazadeNew_700Bold,
  NotoNaskhArabic_400Regular,
  Lateef_400Regular,
  AmiriQuran: require("../assets/fonts/AmiriQuran-Regular.ttf"),
  KFGQPCHafsUthmanicScript: require("../assets/fonts/KFGQPCHafsUthmanicScript-v18.ttf"),
}

/** Preview line under each font option: opening of 33:23 (page 421), as served by quran.com. */
export const MUSHAF_FONT_PREVIEW: Record<MushafTextField, string> = {
  text_uthmani:
    "\u0645\u0651\u0650\u0646\u064E \u0671\u0644\u0652\u0645\u064F\u0624\u0652\u0645\u0650\u0646\u0650\u064A\u0646\u064E",
  text_qpc_hafs:
    "\u0645\u0651\u0650\u0646\u064E \u0671\u0644\u06E1\u0645\u064F\u0624\u06E1\u0645\u0650\u0646\u0650\u064A\u0646\u064E",
}

/** Bismillah (1:1) in KFGQPC encoding, from quran.com text_qpc_hafs. */
export const QPC_HAFS_BISMILLAH =
  "\u0628\u0650\u0633\u06E1\u0645\u0650 \u0671\u0644\u0644\u0651\u064E\u0647\u0650 \u0671\u0644\u0631\u0651\u064E\u062D\u06E1\u0645\u064E\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650"

/** Text for one mushaf word in the encoding the font expects. */
export function mushafWordText(font: MushafFontConfig, piece: { text: string; qpcText?: string }) {
  return font.textField === "text_qpc_hafs" && piece.qpcText ? piece.qpcText : piece.text
}

export function getMushafFont(id: string | null | undefined): MushafFontConfig {
  return (
    MUSHAF_FONTS.find(font => font.id === id) ??
    MUSHAF_FONTS.find(font => font.id === DEFAULT_MUSHAF_FONT_ID)!
  )
}

export const DEFAULT_MUSHAF_FONT = getMushafFont(DEFAULT_MUSHAF_FONT_ID)

/** For text that only has text_uthmani (no QPC encoding) or screens that don't load KFGQPC. */
export const UTHMANI_MUSHAF_FONT = getMushafFont("scheherazade")

export function mushafFontMetrics(font: MushafFontConfig, fontSize: number) {
  const size = Math.round(fontSize * font.sizeScale)
  return {
    fontSize: size,
    lineHeight: Math.round(size * font.lineHeight),
    bismillahLineHeight: Math.round(size * font.bismillahLineHeight),
  }
}

let cachedFontId: MushafFontId | null = null

export function useMushafFont() {
  const [fontId, setFontIdState] = useState<MushafFontId>(cachedFontId ?? DEFAULT_MUSHAF_FONT_ID)

  useEffect(() => {
    if (cachedFontId) return
    let cancelled = false
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), readCachedPremium()])
      .then(([raw, premium]) => {
        const saved = getMushafFont(raw)
        const id = saved.premium && !premium.isPremium ? DEFAULT_MUSHAF_FONT_ID : saved.id
        cachedFontId = id
        if (!cancelled) setFontIdState(id)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const setFontId = useCallback((id: MushafFontId) => {
    cachedFontId = id
    setFontIdState(id)
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {})
  }, [])

  return { font: getMushafFont(fontId), fontId, setFontId }
}
