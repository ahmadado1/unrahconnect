// Key places for the offline map (Makkah and Madinah).
// Stored inside the app, so the list, distances and direction arrows work with NO internet
// (GPS and the compass work offline). Coordinates are approximate.

export type OfflineCity = "makkah" | "madinah"
export type OfflinePlaceKind = "mosque" | "gate" | "water" | "hospital" | "pharmacy" | "site" | "landmark"

export type OfflinePlace = {
  id: string
  city: OfflineCity
  kind: OfflinePlaceKind
  /** i18n key for the name */
  nameKey: string
  lat: number
  lng: number
}

export const CITY_CENTER: Record<OfflineCity, { lat: number; lng: number }> = {
  makkah: { lat: 21.4225, lng: 39.8262 },
  madinah: { lat: 24.4672, lng: 39.6111 },
}

export const OFFLINE_PLACES: OfflinePlace[] = [
  // ─── Makkah ───
  { id: "haram", city: "makkah", kind: "mosque", nameKey: "masjidAlHaram", lat: 21.4225, lng: 39.8262 },
  { id: "zamzam", city: "makkah", kind: "water", nameKey: "zamzamWell", lat: 21.4228, lng: 39.8261 },
  { id: "safa", city: "makkah", kind: "site", nameKey: "safaMarwah", lat: 21.4221, lng: 39.8268 },
  { id: "gate-fahd", city: "makkah", kind: "gate", nameKey: "gateFahdName", lat: 21.4228, lng: 39.826 },
  { id: "gate-abdulaziz", city: "makkah", kind: "gate", nameKey: "gateAbdulazizName", lat: 21.4232, lng: 39.8255 },
  { id: "gate-umrah", city: "makkah", kind: "gate", nameKey: "gateUmrahName", lat: 21.4219, lng: 39.8271 },
  { id: "gate-safa", city: "makkah", kind: "gate", nameKey: "gateSafaName", lat: 21.4214, lng: 39.8267 },
  { id: "gate-marwah", city: "makkah", kind: "gate", nameKey: "gateMarwahName", lat: 21.4223, lng: 39.8275 },
  { id: "gate-ajyad", city: "makkah", kind: "gate", nameKey: "gateAjyadName", lat: 21.4208, lng: 39.826 },
  { id: "gate-salam", city: "makkah", kind: "gate", nameKey: "gateSalamName", lat: 21.4231, lng: 39.8268 },
  { id: "clock-tower", city: "makkah", kind: "landmark", nameKey: "om_clockTower", lat: 21.4189, lng: 39.8262 },
  { id: "pharmacy-nahdi", city: "makkah", kind: "pharmacy", nameKey: "pharmacyNahdiName", lat: 21.4195, lng: 39.8255 },
  { id: "hospital-faisal", city: "makkah", kind: "hospital", nameKey: "hospitalFaisalName", lat: 21.4156, lng: 39.8234 },
  { id: "hospital-abdulaziz", city: "makkah", kind: "hospital", nameKey: "hospitalAbdulazizName", lat: 21.4308, lng: 39.8436 },
  { id: "hospital-noor", city: "makkah", kind: "hospital", nameKey: "hospitalNoorName", lat: 21.3892, lng: 39.8579 },
  { id: "mina", city: "makkah", kind: "site", nameKey: "mina", lat: 21.4133, lng: 39.893 },
  { id: "arafah", city: "makkah", kind: "site", nameKey: "arafah", lat: 21.3549, lng: 39.9845 },

  // ─── Madinah ───
  { id: "nabawi", city: "madinah", kind: "mosque", nameKey: "masjidNabawi", lat: 24.4672, lng: 39.6111 },
  { id: "baqi", city: "madinah", kind: "site", nameKey: "om_baqi", lat: 24.4673, lng: 39.6164 },
  { id: "quba", city: "madinah", kind: "mosque", nameKey: "om_quba", lat: 24.4393, lng: 39.6173 },
  { id: "qiblatain", city: "madinah", kind: "mosque", nameKey: "om_qiblatain", lat: 24.484, lng: 39.5788 },
  { id: "uhud", city: "madinah", kind: "site", nameKey: "om_uhud", lat: 24.5017, lng: 39.6125 },
  { id: "hospital-fahd-madinah", city: "madinah", kind: "hospital", nameKey: "hospitalFahdMadinahName", lat: 24.4889, lng: 39.6289 },
]

export const PLACE_ICON: Record<OfflinePlaceKind, string> = {
  mosque: "moon",
  gate: "enter-outline",
  water: "water",
  hospital: "medkit",
  pharmacy: "bandage",
  site: "flag",
  landmark: "business",
}

const toRad = (d: number) => (d * Math.PI) / 180

/** Distance in metres between two points. */
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Compass direction from a to b, 0–360 degrees (0 = north). */
export function bearingDegrees(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat))
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng))
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

export function formatDistance(m: number) {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`
}

/** Walking time at about 4.5 km/h, in minutes. */
export function walkMinutes(m: number) {
  return Math.max(1, Math.round(m / 75))
}
