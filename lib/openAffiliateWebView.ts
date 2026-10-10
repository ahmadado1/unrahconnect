import { isGoogleMapsUrl, openGoogleMapsUrl } from "@/lib/openMaps"
import * as WebBrowser from "expo-web-browser"
import { Linking } from "react-native"

/** In-app WebView route for websites and affiliate clicks. */
export const AFFILIATE_WEBVIEW_PATH = "/hotel-webview" as const

const CJ_HOST_MARKERS = [
  "anrdoezrs.net",
  "jdoqocy.com",
  "tkqlhce.com",
  "kqzyfj.com",
  "dpbolvw.net",
  "emjcd.com",
  "qksrv.net",
]

export function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

export function isAffiliateTrackingUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return CJ_HOST_MARKERS.some(marker => host === marker || host.endsWith(`.${marker}`))
  } catch {
    return false
  }
}

/** Maps, chat, rides, and store listings should leave the app. */
export function shouldOpenInSystemApp(url: string): boolean {
  if (!isHttpUrl(url)) return true
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    const path = `${parsed.pathname}${parsed.search}`.toLowerCase()
    if (host === "wa.me" || host.endsWith("whatsapp.com")) return true
    if (host.includes("maps.google.") || host.endsWith("maps.apple.com")) return true
    if (host.includes("google.") && path.includes("/maps")) return true
    if (host.endsWith("uber.com")) return true
    if (host === "apps.apple.com" || host === "play.google.com") return true
    return false
  } catch {
    return false
  }
}

export function inAppWebViewHref(url: string, title?: string) {
  return {
    pathname: AFFILIATE_WEBVIEW_PATH,
    params: {
      url,
      ...(title ? { title } : {}),
    },
  }
}

/** @deprecated Use inAppWebViewHref */
export const affiliateWebViewHref = inAppWebViewHref

export function isDonationUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "")
    return host === "maidabofoundation.com"
  } catch {
    return false
  }
}

/** Charity donations open in the system browser, never inside the app. */
export async function openDonationPage(url = "https://maidabofoundation.com/") {
  try {
    await WebBrowser.openBrowserAsync(url)
  } catch {
    await Linking.openURL(url)
  }
}

/** Open http(s) websites in-app; keep tel/maps/WhatsApp/store links native. */
export function openExternalUrl(router: { push: (href: any) => void }, url: string, title?: string) {
  if (!url) return
  if (isDonationUrl(url)) {
    void openDonationPage(url)
    return
  }
  if (isGoogleMapsUrl(url)) {
    void openGoogleMapsUrl(url, title ? { name: title } : undefined)
    return
  }
  if (isHttpUrl(url) && !shouldOpenInSystemApp(url)) {
    router.push(inAppWebViewHref(url, title))
    return
  }
  void Linking.openURL(url)
}
