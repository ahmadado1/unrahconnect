// Layout direction (left-to-right or right-to-left) for the app language.
// Arabic and Urdu are right-to-left. React Native only applies a direction change
// when the app restarts, so "I18nManager.isRTL" tells us the direction the app is
// running in NOW, not the one saved for the next start.
import AsyncStorage from "@react-native-async-storage/async-storage"
import { DevSettings, I18nManager } from "react-native"

const RTL_LANGS = new Set(["ar", "ur"])
const FIX_KEY = "rtl_fix_reload_at"

export function isRtlLanguage(code: string) {
  return RTL_LANGS.has(String(code || "en").split("-")[0].toLowerCase())
}

function setDirection(wantRtl: boolean) {
  try {
    I18nManager.allowRTL(wantRtl)
    I18nManager.forceRTL(wantRtl)
    return true
  } catch (e) {
    console.warn("[RTL] Failed to set direction:", e)
    return false
  }
}

/**
 * Call when the user picks a language.
 * Always saves the wanted direction for the next start. (The old version stopped early when
 * the running direction already matched, so Arabic → English before a restart left the
 * app stuck in right-to-left.)
 */
export async function applyRtlForLanguage(code: string): Promise<void> {
  const wantRtl = isRtlLanguage(code)
  setDirection(wantRtl)
  // The layout itself flips after a restart: see restartIfDirectionWrong().
}

/** Restart the app (dev: reload, release: expo-updates). Returns false if not possible. */
async function restartApp(): Promise<boolean> {
  if (__DEV__) {
    if (typeof DevSettings?.reload === "function") {
      DevSettings.reload()
      return true
    }
    return false
  }
  try {
    const Updates = await import("expo-updates")
    await Updates.reloadAsync()
    return true
  } catch (e) {
    console.warn("[RTL] Restart failed:", e)
    return false
  }
}

/**
 * If the app is running in the wrong direction for this language (e.g. just switched
 * English → Arabic), restart it now so the layout flips at once.
 * Call AFTER the language is saved. Waits a moment so the language menu can close.
 */
export async function restartIfDirectionWrong(code: string): Promise<void> {
  const wantRtl = isRtlLanguage(code)
  if (I18nManager.isRTL === wantRtl) return
  setDirection(wantRtl)
  try {
    await AsyncStorage.setItem(FIX_KEY, String(Date.now()))
  } catch {}
  await new Promise(resolve => setTimeout(resolve, 600))
  await restartApp()
}

/**
 * Call once when the app starts, with the saved language.
 * If the app opened in the wrong direction (for example an old stuck setting, or an Arabic phone
 * with the app in English), fix it and restart the app once.
 */
export async function syncRtlAtStartup(code: string): Promise<void> {
  const wantRtl = isRtlLanguage(code)
  if (I18nManager.isRTL === wantRtl) {
    // Make sure the saved direction matches too, for the next start.
    setDirection(wantRtl)
    return
  }
  if (!setDirection(wantRtl)) return

  // Restart at most once every 2 minutes, so a phone that refuses the change can never loop.
  try {
    const last = Number((await AsyncStorage.getItem(FIX_KEY)) || 0)
    if (Date.now() - last < 2 * 60 * 1000) return
    await AsyncStorage.setItem(FIX_KEY, String(Date.now()))
  } catch {
    return
  }

  // If restart is not possible, the right direction still applies on the next launch.
  await restartApp()
}
