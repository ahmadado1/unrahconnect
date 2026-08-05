import type { ImageSourcePropType } from "react-native"

/** Shared phase header assets for Umrah & Hajj detail screens and guide cards */
export const PHASE_HEADER_IMAGES: Record<string, ImageSourcePropType> = {
  "ihram-header": require("../assets/photos/ihram-header.jpg"),
  "tawaf-header": require("../assets/photos/tawaf-header.jpg"),
  "sai-header": require("../assets/photos/sai-header.jpg"),
  "arafah-header": require("../assets/photos/arafah-header.jpg"),
  "jamarat-header": require("../assets/photos/jamarat-header.jpg"),
  "mina-header": require("../assets/photos/mina-header.jpg"),
  "muzdalifah-header": require("../assets/photos/muzdalifah-header.jpg"),
}

export function getPhaseHeaderImage(
  key?: string | null,
): ImageSourcePropType | null {
  if (!key) return null
  return PHASE_HEADER_IMAGES[key] ?? null
}

export function photoHeaderHeight(windowHeight: number) {
  return Math.round(Math.min(300, Math.max(260, windowHeight * 0.33)))
}
