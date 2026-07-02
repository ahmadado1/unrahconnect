export type HaramainStationId = "makkah" | "madinah"

export type HaramainStationInfo = {
  id: HaramainStationId
  emoji: string
  titleKey: string
  arabicNameKey: string
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

export const HARAMAIN_BOOK_URL = "https://www.haramainrailway.sa"
export const HARAMAIN_PHONE = "920004433"
export const HARAMAIN_PHONE_DISPLAY = "920 004 433"

export const HARAMAIN_STATIONS: Record<HaramainStationId, HaramainStationInfo> = {
  makkah: {
    id: "makkah",
    emoji: "🚄",
    titleKey: "makkahStation",
    arabicNameKey: "hhrMakkahArabic",
    lat: 21.4536,
    lng: 39.8018,
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
    emoji: "🚄",
    titleKey: "madinahStation",
    arabicNameKey: "hhrMadinahArabic",
    lat: 24.5489,
    lng: 39.7392,
    addressKey: "madinahStationAddress",
    distanceKey: "hhrMadinahDistance",
    hoursKey: "hhrMadinahHours",
    journeyKey: "hhrMadinahJourney",
    priceEconomyKey: "hhrMadinahPriceEconomy",
    priceBusinessKey: "hhrMadinahPriceBusiness",
    phone: HARAMAIN_PHONE,
    bookUrl: HARAMAIN_BOOK_URL,
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
