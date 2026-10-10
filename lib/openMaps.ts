import i18n from "@/i18n"
import * as WebBrowser from "expo-web-browser"
import { Alert, Linking, Platform } from "react-native"

type MapTarget = {
  name: string
  latitude?: number
  longitude?: number
  directions: boolean
}

/** True for the Google Maps links this app already opens. */
export function isGoogleMapsUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    const path = `${parsed.pathname}${parsed.search}`.toLowerCase()
    if (host.includes("maps.google.") || host === "maps.google.com") return true
    if ((host === "google.com" || host.endsWith(".google.com")) && path.includes("/maps")) return true
    return false
  } catch {
    return false
  }
}

function parseLatLng(value: string): { latitude: number; longitude: number } | null {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/)
  if (!match) return null
  const latitude = Number(match[1])
  const longitude = Number(match[2])
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
  return { latitude, longitude }
}

function parseGoogleMapsUrl(url: string): MapTarget {
  const parsed = new URL(url)
  const destination = parsed.searchParams.get("destination")
  const query = parsed.searchParams.get("q") || parsed.searchParams.get("query")
  const directions = parsed.pathname.toLowerCase().includes("/dir") || destination != null
  const raw = decodeURIComponent(destination || query || "").replace(/\+/g, " ").trim()
  const paren = raw.match(/\(([^)]+)\)\s*$/)
  const coords = parseLatLng(raw)
  const nameFromUrl = paren?.[1]?.trim() || (coords ? "" : raw)
  return {
    name: nameFromUrl || "Location",
    latitude: coords?.latitude,
    longitude: coords?.longitude,
    directions,
  }
}

function appleMapsUrl(target: MapTarget): string {
  if (target.directions) {
    if (target.latitude != null && target.longitude != null) {
      return `http://maps.apple.com/?daddr=${target.latitude},${target.longitude}`
    }
    return `http://maps.apple.com/?daddr=${encodeURIComponent(target.name)}`
  }
  if (target.latitude != null && target.longitude != null) {
    return `http://maps.apple.com/?ll=${target.latitude},${target.longitude}&q=${encodeURIComponent(target.name)}`
  }
  return `http://maps.apple.com/?q=${encodeURIComponent(target.name)}`
}

async function openGoogleMapsLink(googleUrl: string) {
  if (Platform.OS === "ios") {
    let installed = false
    try {
      installed = await Linking.canOpenURL("comgooglemaps://")
    } catch {
      installed = false
    }
    if (!installed) {
      await WebBrowser.openBrowserAsync(googleUrl)
      return
    }
  }
  await Linking.openURL(googleUrl)
}

/**
 * Android opens the existing Google Maps link.
 * iOS asks for Apple Maps first, then Google Maps.
 */
export function openGoogleMapsUrl(
  googleUrl: string,
  options?: { name?: string; latitude?: number; longitude?: number; directions?: boolean }
): Promise<void> {
  if (Platform.OS !== "ios") {
    return Linking.openURL(googleUrl)
  }

  let parsed: MapTarget = { name: options?.name || "Location", directions: false }
  try {
    parsed = parseGoogleMapsUrl(googleUrl)
  } catch {
    // Keep the override fields below.
  }

  const target: MapTarget = {
    name: options?.name || parsed.name,
    latitude: options?.latitude ?? parsed.latitude,
    longitude: options?.longitude ?? parsed.longitude,
    directions: options?.directions ?? parsed.directions,
  }

  return new Promise(resolve => {
    Alert.alert(target.name, undefined, [
      {
        text: "Apple Maps",
        onPress: () => {
          void Linking.openURL(appleMapsUrl(target)).finally(resolve)
        },
      },
      {
        text: "Google Maps",
        onPress: () => {
          void openGoogleMapsLink(googleUrl).finally(resolve)
        },
      },
      {
        text: i18n.t("cancel", { defaultValue: "Cancel" }),
        style: "cancel",
        onPress: () => resolve(),
      },
    ], { cancelable: true, onDismiss: () => resolve() })
  })
}
