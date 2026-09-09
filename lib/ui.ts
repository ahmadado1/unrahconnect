import { Platform, StyleSheet, type ViewStyle } from "react-native"

/** Canonical brand colors — use these instead of one-off hex. */
export const NAVY = "#1E3A5F"
export const NAVY_DEEP = "#152A47"
export const GOLD = "#C9A84C"
export const CREAM = "#F5F0E8"

export const ui = {
  navy: NAVY,
  gold: GOLD,
  cream: CREAM,
  radius: 16,
  radiusSm: 12,
  radiusPill: 999,
  space: 16,
  spaceSm: 12,
  gap: 12,
  cardPad: 16,
  hairline: StyleSheet.hairlineWidth,
  pressOpacity: 0.82,
  pressScale: 0.98,
  disabledOpacity: 0.42,
} as const

export const cardShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#1E3A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  android: {
    elevation: 3,
  },
  default: {},
}) as ViewStyle

export const cardChrome: ViewStyle = {
  borderRadius: ui.radius,
  borderWidth: ui.hairline,
  padding: ui.cardPad,
  ...cardShadow,
}

export function tabScrollBottom(insetsBottom: number) {
  return Math.max(insetsBottom, 8) + 88
}
