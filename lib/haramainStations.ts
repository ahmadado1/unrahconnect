export type HaramainStationId = "makkah" | "madinah"

export type HaramainStationInfo = {
  id: HaramainStationId
  icon: "train"
  titleKey: string
  arabicNameKey: string
  /** Display / Maps pin label */
  mapsName: string
  /** Google Maps search query for accurate pin placement */
  mapsQuery: string
  lat: number
  lng: number
  addressKey: string
  distanceKey: string
  hoursKey: string
  journeyKey: string
  priceEconomyKey: string
  priceBusinessKey: string
  phone: string
  bookUrl: string
  image: string
  overviewKeys: string[]
  gettingThereKeys: string[]
  facilityKeys: string[]
  bookingKeys: string[]
  tipKeys: string[]
}

export const HARAMAIN_BOOK_URL = "https://sar.hhr.sa"
export const HARAMAIN_BOOK_URL_MADINAH = "https://sar.hhr.sa/-/madinah"
export const HARAMAIN_PHONE = "920004433"
export const HARAMAIN_PHONE_DISPLAY = "920 004 433"

export const HARAMAIN_STATIONS: Record<HaramainStationId, HaramainStationInfo> = {
  makkah: {
    id: "makkah",
    icon: "train",
    titleKey: "makkahStation",
    arabicNameKey: "hhrMakkahArabic",
    mapsName: "Haramain High Speed Railway Station",
    mapsQuery: "Haramain High Speed Railway Station Makkah",
    lat: 21.4177,
    lng: 39.787151,
    addressKey: "makkahStationAddress",
    distanceKey: "hhrMakkahDistance",
    hoursKey: "hhrMakkahHours",
    journeyKey: "hhrMakkahJourney",
    priceEconomyKey: "hhrMakkahPriceEconomy",
    priceBusinessKey: "hhrMakkahPriceBusiness",
    phone: HARAMAIN_PHONE,
    bookUrl: HARAMAIN_BOOK_URL,
    image: "https://images.unsplash.com/photo-1474487548417-781cb77882ba?w=800",
    overviewKeys: ["hhrMakkahOverview1", "hhrMakkahOverview2"],
    gettingThereKeys: ["hhrMakkahGetting1", "hhrMakkahGetting2", "hhrMakkahGetting3"],
    facilityKeys: ["hhrMakkahFacility1", "hhrMakkahFacility2", "hhrMakkahFacility3"],
    bookingKeys: ["hhrMakkahBooking1", "hhrMakkahBooking2", "hhrMakkahBooking3"],
    tipKeys: ["hhrMakkahTip1", "hhrMakkahTip2", "hhrMakkahTip3"],
  },
  madinah: {
    id: "madinah",
    icon: "train",
    titleKey: "madinahStation",
    arabicNameKey: "hhrMadinahArabic",
    mapsName: "Haramain High Speed Railway Station",
    mapsQuery: "Haramain High Speed Railway Station Madinah",
    lat: 24.470975,
    lng: 39.699685,
    addressKey: "madinahStationAddress",
    distanceKey: "hhrMadinahDistance",
    hoursKey: "hhrMadinahHours",
    journeyKey: "hhrMadinahJourney",
    priceEconomyKey: "hhrMadinahPriceEconomy",
    priceBusinessKey: "hhrMadinahPriceBusiness",
    phone: HARAMAIN_PHONE,
    bookUrl: HARAMAIN_BOOK_URL_MADINAH,
    image: "https://images.unsplash.com/photo-1515169067865-5387ec6ff214?w=800",
    overviewKeys: ["hhrMadinahOverview1", "hhrMadinahOverview2"],
    gettingThereKeys: ["hhrMadinahGetting1", "hhrMadinahGetting2", "hhrMadinahGetting3"],
    facilityKeys: ["hhrMadinahFacility1", "hhrMadinahFacility2", "hhrMadinahFacility3"],
    bookingKeys: ["hhrMadinahBooking1", "hhrMadinahBooking2", "hhrMadinahBooking3"],
    tipKeys: ["hhrMadinahTip1", "hhrMadinahTip2", "hhrMadinahTip3"],
  },
}

export function getHaramainStation(id: string | undefined): HaramainStationInfo | null {
  if (id === "makkah" || id === "madinah") return HARAMAIN_STATIONS[id]
  return null
}

/** Google Maps URL pinned to station coords with the official place query as the label. */
export function haramainStationMapsUrl(
  station: Pick<HaramainStationInfo, "lat" | "lng" | "mapsQuery">
): string {
  const label = encodeURIComponent(station.mapsQuery)
  return `https://maps.google.com/?q=${station.lat},${station.lng}(${label})`
}
