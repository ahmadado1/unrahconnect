import AsyncStorage from "@react-native-async-storage/async-storage"

const STORAGE_KEY = "trip_details_v1"
const PROMPTED_KEY = "trip_details_prompted_v1"

export type TripDetails = {
  originCode: string
  originCity: string
  /** YYYY-MM-DD */
  checkIn: string
  /** YYYY-MM-DD */
  checkOut: string
  guests: number
}

export type AirportOption = {
  code: string
  city: string
  country: string
}

/** Common Umrah departure airports. A typed 3-letter code is also accepted. */
export const DEPARTURE_AIRPORTS: AirportOption[] = [
  { code: "LHR", city: "London", country: "United Kingdom" },
  { code: "LGW", city: "London Gatwick", country: "United Kingdom" },
  { code: "MAN", city: "Manchester", country: "United Kingdom" },
  { code: "CDG", city: "Paris", country: "France" },
  { code: "FRA", city: "Frankfurt", country: "Germany" },
  { code: "AMS", city: "Amsterdam", country: "Netherlands" },
  { code: "IST", city: "Istanbul", country: "Turkey" },
  { code: "SAW", city: "Istanbul Sabiha", country: "Turkey" },
  { code: "CAI", city: "Cairo", country: "Egypt" },
  { code: "CMN", city: "Casablanca", country: "Morocco" },
  { code: "ALG", city: "Algiers", country: "Algeria" },
  { code: "TUN", city: "Tunis", country: "Tunisia" },
  { code: "DXB", city: "Dubai", country: "UAE" },
  { code: "AUH", city: "Abu Dhabi", country: "UAE" },
  { code: "DOH", city: "Doha", country: "Qatar" },
  { code: "KWI", city: "Kuwait", country: "Kuwait" },
  { code: "BAH", city: "Bahrain", country: "Bahrain" },
  { code: "MCT", city: "Muscat", country: "Oman" },
  { code: "AMM", city: "Amman", country: "Jordan" },
  { code: "BEY", city: "Beirut", country: "Lebanon" },
  { code: "KHI", city: "Karachi", country: "Pakistan" },
  { code: "LHE", city: "Lahore", country: "Pakistan" },
  { code: "ISB", city: "Islamabad", country: "Pakistan" },
  { code: "DEL", city: "Delhi", country: "India" },
  { code: "BOM", city: "Mumbai", country: "India" },
  { code: "DAC", city: "Dhaka", country: "Bangladesh" },
  { code: "CGK", city: "Jakarta", country: "Indonesia" },
  { code: "KUL", city: "Kuala Lumpur", country: "Malaysia" },
  { code: "JFK", city: "New York", country: "USA" },
  { code: "IAD", city: "Washington", country: "USA" },
  { code: "LAX", city: "Los Angeles", country: "USA" },
  { code: "YYZ", city: "Toronto", country: "Canada" },
  { code: "JNB", city: "Johannesburg", country: "South Africa" },
  { code: "LOS", city: "Lagos", country: "Nigeria" },
  { code: "ADD", city: "Addis Ababa", country: "Ethiopia" },
]

export function searchAirports(query: string): AirportOption[] {
  const q = query.trim().toLowerCase()
  if (!q) return DEPARTURE_AIRPORTS
  return DEPARTURE_AIRPORTS.filter(airport => {
    const haystack = `${airport.code} ${airport.city} ${airport.country}`.toLowerCase()
    return haystack.includes(q)
  })
}

export function isTripDetails(value: unknown): value is TripDetails {
  if (!value || typeof value !== "object") return false
  const trip = value as TripDetails
  return (
    /^[A-Z]{3}$/.test(trip.originCode) &&
    typeof trip.originCity === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(trip.checkIn) &&
    /^\d{4}-\d{2}-\d{2}$/.test(trip.checkOut) &&
    Number.isFinite(trip.guests) &&
    trip.guests >= 1
  )
}

export async function loadTripDetails(): Promise<TripDetails | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isTripDetails(parsed) ? parsed : null
  } catch {
    return null
  }
}

export async function saveTripDetails(trip: TripDetails): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trip))
  await AsyncStorage.setItem(PROMPTED_KEY, "1")
}

export async function hasPromptedForTripDetails(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PROMPTED_KEY)) === "1"
  } catch {
    return false
  }
}

export async function markTripDetailsPrompted(): Promise<void> {
  await AsyncStorage.setItem(PROMPTED_KEY, "1")
}

export function formatTripSummary(trip: TripDetails, locale: string): string {
  const fmt = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { month: "short", day: "numeric" })
  return `${trip.originCode} · ${fmt(trip.checkIn)} – ${fmt(trip.checkOut)} · ${trip.guests}`
}
