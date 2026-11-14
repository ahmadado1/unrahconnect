// Over-the-air updates without "close the app twice".
//
// Expo's default: the app downloads a new update quietly when it starts, but only uses it the
// NEXT time it starts. Pilgrims rarely close the app fully, so updates could take days to show.
//
// What this adds:
//   1. Look for an update when the app starts and every time it comes back to the screen.
//   2. Download it quietly.
//   3. Use it (quick restart) only when it is safe: right at start-up (first few seconds,
//      while the loading screen shows) or when the user comes back after being away 1+ minute.
//      Never in the middle of using the app.
import { AppState, type AppStateStatus } from "react-native"

const START_WINDOW_MS = 6000 // a restart this soon after opening just looks like loading
const AWAY_MS = 60 * 1000 // away at least a minute: safe to restart on return

let started = false
let ready = false // a new update is downloaded and waiting
let checking = false
let lastCheck = 0
let leftAt = 0
const launchedAt = Date.now()

async function updates() {
  try {
    const mod = await import("expo-updates")
    return mod.isEnabled ? mod : null
  } catch {
    return null
  }
}

async function apply() {
  const U = await updates()
  if (!U) return
  try {
    await U.reloadAsync()
  } catch {}
}

async function checkAndDownload() {
  if (checking || ready || Date.now() - lastCheck < 2 * 60 * 1000) return
  checking = true
  lastCheck = Date.now()
  try {
    const U = await updates()
    if (!U) return
    const res = await U.checkForUpdateAsync()
    if (!res.isAvailable) return
    const got = await U.fetchUpdateAsync()
    if (!got.isNew) return
    ready = true
    // Still on the loading screen: use it straight away
    if (Date.now() - launchedAt < START_WINDOW_MS) void apply()
  } catch {
    // offline or Expo busy: try again next time
  } finally {
    checking = false
  }
}

/** Call once when the app starts (root layout). */
export function startAutoUpdates() {
  if (started || __DEV__) return
  started = true
  void checkAndDownload()
  AppState.addEventListener("change", (state: AppStateStatus) => {
    if (state === "background") {
      leftAt = Date.now()
      return
    }
    if (state !== "active") return
    const wasAway = leftAt > 0 && Date.now() - leftAt >= AWAY_MS
    leftAt = 0
    if (ready && wasAway) {
      void apply()
      return
    }
    void checkAndDownload()
  })
}
