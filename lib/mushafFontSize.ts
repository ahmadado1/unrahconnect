import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useEffect, useState } from "react"
import { useWindowDimensions } from "react-native"

const STORAGE_KEY = "mushaf_font_size_v1"
const PHONE_DEFAULT = 28
const TABLET_DEFAULT = 36
export const MUSHAF_FONT_MIN = 24
export const MUSHAF_FONT_MAX = 42
const STEP = 2

export function defaultMushafFontSize(width: number) {
  return width >= 768 ? TABLET_DEFAULT : PHONE_DEFAULT
}

function clampSize(value: number) {
  const stepped = Math.round(value / STEP) * STEP
  return Math.min(MUSHAF_FONT_MAX, Math.max(MUSHAF_FONT_MIN, stepped))
}

/** Leading room so marks sit clear of the line above. */
export function mushafLineHeight(fontSize: number) {
  return Math.round(fontSize * 2)
}

const ARABIC_INDIC = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"]

export function toArabicIndic(value: number) {
  return String(value).replace(/\d/g, digit => ARABIC_INDIC[Number(digit)] ?? digit)
}

export function useMushafFontSize() {
  const { width } = useWindowDimensions()
  const fallback = defaultMushafFontSize(width)
  const [fontSize, setFontSize] = useState(fallback)

  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (cancelled) return
        const saved = Number(raw)
        if (Number.isFinite(saved) && saved >= MUSHAF_FONT_MIN && saved <= MUSHAF_FONT_MAX) {
          setFontSize(clampSize(saved))
          return
        }
        setFontSize(fallback)
      })
      .catch(() => {
        if (!cancelled) setFontSize(fallback)
      })
    return () => {
      cancelled = true
    }
  }, [fallback])

  const update = useCallback((next: number) => {
    const size = clampSize(next)
    setFontSize(size)
    AsyncStorage.setItem(STORAGE_KEY, String(size)).catch(() => {})
  }, [])

  const decrease = useCallback(() => update(fontSize - STEP), [fontSize, update])
  const increase = useCallback(() => update(fontSize + STEP), [fontSize, update])

  return {
    fontSize,
    decrease,
    increase,
    canDecrease: fontSize > MUSHAF_FONT_MIN,
    canIncrease: fontSize < MUSHAF_FONT_MAX,
  }
}
