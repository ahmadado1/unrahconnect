import { DevSettings, I18nManager } from "react-native"

const RTL_LANGS = new Set(["ar", "ur"])

export function isRtlLanguage(code: string) {
  return RTL_LANGS.has(code.split("-")[0].toLowerCase())
}

/**
 * Align React Native layout direction with Arabic/Urdu.
 * Direction flips on next app restart (or immediate reload in development).
 */
export async function applyRtlForLanguage(code: string): Promise<void> {
  const wantRtl = isRtlLanguage(code)
  if (I18nManager.isRTL === wantRtl) return

  try {
    I18nManager.allowRTL(wantRtl)
    I18nManager.forceRTL(wantRtl)
  } catch (e) {
    console.warn("[RTL] Failed to set direction:", e)
    return
  }

  // Reload so flexDirection / text alignment pick up the new direction.
  if (__DEV__ && typeof DevSettings?.reload === "function") {
    DevSettings.reload()
  }
}
