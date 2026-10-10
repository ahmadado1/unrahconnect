import type { TripDetails } from "@/lib/tripDetails"

export const TP_MARKER = "787351"
export const TP_PROJECT = "583145"
export const TP_PROGRAM = "4114"
export const TP_CAMPAIGN = "100"

/** Calendar day and month as DDMM, from the device's local date. */
function ddmm(date: Date) {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${day}${month}`
}

/**
 * Aviasales search path wrapped in a Travelpayouts tracking link.
 * One way: KAN0211JED1. Return: KAN0211JED16111.
 */
export function buildAviasalesLink(
  from: string,
  to: string,
  departDate: Date,
  returnDate?: Date | null,
  adults = 1,
  subId = "app_flights",
) {
  const origin = from.trim().toUpperCase()
  const destination = to.trim().toUpperCase()
  const passengers = Math.min(9, Math.max(1, Math.round(adults)))
  const path = `${origin}${ddmm(departDate)}${destination}${returnDate ? ddmm(returnDate) : ""}${passengers}`
  const aviasalesUrl = `https://www.aviasales.com/search/${path}`
  return `https://tp.media/r?campaign_id=${TP_CAMPAIGN}&marker=${TP_MARKER}&p=${TP_PROGRAM}&trs=${TP_PROJECT}&sub_id=${encodeURIComponent(subId)}&u=${encodeURIComponent(aviasalesUrl)}`
}

export type FlightPlace = {
  code: string
  city: string
  country: string
}

/** Shown before a search, and when the autocomplete request fails. */
export const POPULAR_FLIGHT_CITIES: FlightPlace[] = [
  { code: "KAN", city: "Kano", country: "Nigeria" },
  { code: "ABV", city: "Abuja", country: "Nigeria" },
  { code: "LOS", city: "Lagos", country: "Nigeria" },
  { code: "NIM", city: "Niamey", country: "Niger" },
  { code: "ABJ", city: "Abidjan", country: "Côte d’Ivoire" },
  { code: "DKR", city: "Dakar", country: "Senegal" },
  { code: "ACC", city: "Accra", country: "Ghana" },
  { code: "CAI", city: "Cairo", country: "Egypt" },
  { code: "KHI", city: "Karachi", country: "Pakistan" },
  { code: "LHE", city: "Lahore", country: "Pakistan" },
  { code: "DAC", city: "Dhaka", country: "Bangladesh" },
  { code: "JKT", city: "Jakarta", country: "Indonesia" },
  { code: "IST", city: "Istanbul", country: "Turkey" },
  { code: "LON", city: "London", country: "United Kingdom" },
]

export function formatFlightPlace(place: FlightPlace) {
  return `${place.city}, ${place.country} (${place.code})`
}

/** Travelpayouts autocomplete supports en, ar, fr, and tr. Other app languages use English. */
export function travelpayoutsLocale(language: string) {
  const base = language.toLowerCase().split(/[-_]/)[0]
  if (base === "ar" || base === "fr" || base === "tr") return base
  return "en"
}

type PlacesResponseRow = {
  type?: string
  code?: string
  name?: string
  country_name?: string
  city_name?: string
}

export function placesFromAutocomplete(data: unknown): FlightPlace[] {
  if (!Array.isArray(data)) return []
  const seen = new Set<string>()
  const places: FlightPlace[] = []
  for (const item of data) {
    if (!item || typeof item !== "object") continue
    const row = item as PlacesResponseRow
    const code = String(row.code || "").trim().toUpperCase()
    if (!/^[A-Z]{3}$/.test(code) || seen.has(code)) continue
    const city = String((row.type === "airport" ? row.city_name || row.name : row.name || row.city_name) || "").trim()
    const country = String(row.country_name || "").trim()
    if (!city || !country) continue
    seen.add(code)
    places.push({ code, city, country })
  }
  return places
}

export async function searchFlightPlaces(term: string, language: string, signal?: AbortSignal) {
  const query = term.trim()
  const locale = travelpayoutsLocale(language)
  const url =
    `https://autocomplete.travelpayouts.com/places2?term=${encodeURIComponent(query)}` +
    `&locale=${locale}&types[]=city&types[]=airport`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error("places search failed")
  return placesFromAutocomplete(await response.json())
}

export type FlightDestination = "JED" | "MED"

export type FlightPlatform = {
  id: string
  name: string
  icon: "airplane"
  tagline: string
  description: string
  pilgrimTip: string
  website: string
  websiteLabel: string
  brandColor: string
  jeddahUrl: string
  madinahUrl: string
}

export const FLIGHT_PLATFORMS: FlightPlatform[] = [
  {
    id: "saudia",
    name: "Saudia Airlines",
    icon: "airplane",
    tagline: "Official Saudi carrier — direct to Jeddah & Madinah",
    description:
      "Saudi Arabia’s national airline with direct flights into Jeddah (King Abdulaziz) and Madinah (Prince Mohammad Bin Abdulaziz) — ideal for Umrah and Hajj journeys.",
    pilgrimTip: "Book early for Ramadan and Hajj season — seats and baggage options fill up fast.",
    website: "https://www.saudia.com",
    websiteLabel: "saudia.com",
    brandColor: "#006400",
    jeddahUrl: "https://www.saudia.com",
    madinahUrl: "https://www.saudia.com",
  },
  {
    id: "kayak",
    name: "Kayak",
    icon: "airplane",
    tagline: "Compare hundreds of flight sites at once",
    description:
      "Kayak searches airlines and travel sites side by side so you can compare prices, stops, and times for flights toward Jeddah and Madinah.",
    pilgrimTip: "Set a price alert for Jeddah (JED) or Madinah (MED) a few weeks before you travel.",
    website: "https://www.kayak.com",
    websiteLabel: "kayak.com",
    brandColor: "#FF690F",
    jeddahUrl: "https://www.kayak.com/flights/to-JED",
    madinahUrl: "https://www.kayak.com/flights/to-MED",
  },
  {
    id: "skyscanner",
    name: "Skyscanner",
    icon: "airplane",
    tagline: "Find the best flight deals worldwide",
    description:
      "Skyscanner helps you discover flexible dates and competitive fares worldwide — useful when comparing routes into Jeddah or Madinah.",
    pilgrimTip: "Try “Whole month” search around your Umrah dates to catch lower fares.",
    website: "https://www.skyscanner.com",
    websiteLabel: "skyscanner.com",
    brandColor: "#0770E3",
    jeddahUrl: "https://www.skyscanner.com/transport/flights/to/jed/",
    madinahUrl: "https://www.skyscanner.com/transport/flights/to/med/",
  },
]

export function getFlightPlatformById(id: string | string[] | undefined) {
  const key = Array.isArray(id) ? id[0] : id
  if (!key) return null
  return FLIGHT_PLATFORMS.find(p => p.id === key) ?? null
}

function yymmdd(iso: string) {
  return iso.slice(2).replace(/-/g, "")
}

function yyyymmdd(iso: string) {
  return iso.replace(/-/g, "")
}

/**
 * Search URL with the saved origin, JED or MED, and travel dates.
 * Without a saved trip, the existing destination link is used unchanged.
 */
export function flightSearchUrl(
  platform: FlightPlatform,
  destination: FlightDestination,
  trip: TripDetails | null,
): string {
  const fallback = destination === "JED" ? platform.jeddahUrl : platform.madinahUrl
  if (!trip?.originCode || !trip.checkIn || !trip.checkOut) return fallback

  const origin = trip.originCode.toUpperCase()
  const guests = Math.min(9, Math.max(1, Math.round(trip.guests || 1)))

  if (platform.id === "kayak") {
    return `https://www.kayak.com/flights/${origin}-${destination}/${trip.checkIn}/${trip.checkOut}/${guests}adults`
  }
  if (platform.id === "skyscanner") {
    return `https://www.skyscanner.com/transport/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/${yymmdd(trip.checkIn)}/${yymmdd(trip.checkOut)}/?adultsv2=${guests}`
  }
  if (platform.id === "saudia") {
    return `https://www.saudia.com/en/booking/search?B_LOCATION_1=${origin}&E_LOCATION_1=${destination}&B_DATE_1=${yyyymmdd(trip.checkIn)}0000&B_LOCATION_2=${destination}&E_LOCATION_2=${origin}&B_DATE_2=${yyyymmdd(trip.checkOut)}0000&TRIP_TYPE=R&CABIN=E&TRAVELERS=${guests}`
  }
  return fallback
}
