// Location permission, the safe way.
//
// On Android, calling Location.requestForegroundPermissionsAsync() ALWAYS opens the system
// permission screen for a moment — even when permission is already granted. That sends the
// app to the background and back. The prayer-times refresh runs every time the app comes
// back, asked for location again, and so on: an endless loop that froze and crashed the app
// on Android (hundreds of times a minute). So:
//   1. First just CHECK the permission (no screen).
//   2. Only ASK when the user has never answered and Android still allows asking.
//   3. Never ask twice at the same moment.
import * as Location from "expo-location"

let asking: Promise<boolean> | null = null

/** true if the app may use location. Asks the user only when they have never answered. */
export async function ensureLocationPermission(): Promise<boolean> {
  try {
    const current = await Location.getForegroundPermissionsAsync()
    if (current.status === "granted") return true
    if (current.status === "denied" && !current.canAskAgain) return false
    if (current.status === "denied") return false // already said no: don't nag every time
    if (!asking) {
      asking = Location.requestForegroundPermissionsAsync()
        .then(r => r.status === "granted")
        .catch(() => false)
        .finally(() => {
          asking = null
        })
    }
    return await asking
  } catch {
    return false
  }
}

/** For a button the user tapped on purpose (e.g. "Find my location"): asks again if allowed. */
export async function askLocationPermission(): Promise<boolean> {
  try {
    const current = await Location.getForegroundPermissionsAsync()
    if (current.status === "granted") return true
    if (!current.canAskAgain) return false
    const r = await Location.requestForegroundPermissionsAsync()
    return r.status === "granted"
  } catch {
    return false
  }
}
