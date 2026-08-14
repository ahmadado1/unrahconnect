export type MakkahPlace = {
  id: string
  titleKey: string
  arabic: string
  descriptionKey: string
  /** Opens browser search / Wikipedia when detail is limited */
  moreInfoQuery: string
  lat?: number
  lng?: number
  /** Local video asset key (resolved in detail screen) */
  videoKey?: "clock-tower-museum"
}

/** Sightseeing / ziyarah-style places in Makkah ("Places to See"). */
export const MAKKAH_PLACES: MakkahPlace[] = [
  {
    id: "abraj-mall",
    titleKey: "makkahPlaceAbrajTitle",
    arabic: "أبراج البيت",
    descriptionKey: "makkahPlaceAbrajDesc",
    moreInfoQuery: "Abraj Al Bait Mall Makkah",
    lat: 21.4183,
    lng: 39.8260,
  },
  {
    id: "clock-tower-museum",
    titleKey: "makkahPlaceMuseumTitle",
    arabic: "متحف ساعة مكة",
    descriptionKey: "makkahPlaceMuseumDesc",
    moreInfoQuery: "Makkah Clock Tower Museum Abraj Al Bait",
    lat: 21.4186,
    lng: 39.8262,
    videoKey: "clock-tower-museum",
  },
]

export function getMakkahPlace(id: string): MakkahPlace | undefined {
  return MAKKAH_PLACES.find(p => p.id === id)
}
