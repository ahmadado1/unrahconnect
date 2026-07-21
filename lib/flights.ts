export type FlightPlatform = {
  id: string
  name: string
  emoji: string
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
    emoji: "🟢",
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
    emoji: "🟠",
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
    emoji: "🔵",
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
