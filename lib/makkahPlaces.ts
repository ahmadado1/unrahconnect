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
  {
    id: "jabal-nour",
    titleKey: "makkahPlaceNourTitle",
    arabic: "جبل النور · غار حراء",
    descriptionKey: "makkahPlaceNourDesc",
    moreInfoQuery: "Jabal al-Nour Cave of Hira Makkah",
    lat: 21.4578,
    lng: 39.8617,
  },
  {
    id: "jabal-thawr",
    titleKey: "makkahPlaceThawrTitle",
    arabic: "جبل ثور · غار ثور",
    descriptionKey: "makkahPlaceThawrDesc",
    moreInfoQuery: "Jabal Thawr Cave of Thawr Makkah",
    lat: 21.3775,
    lng: 39.8508,
  },
  {
    id: "taneem",
    titleKey: "makkahPlaceTaneemTitle",
    arabic: "مسجد التنعيم",
    descriptionKey: "makkahPlaceTaneemDesc",
    moreInfoQuery: "Masjid Al-Taneem At-Tan'im Miqat Makkah",
    lat: 21.4681,
    lng: 39.8044,
  },
  {
    id: "mualla",
    titleKey: "makkahPlaceMuallaTitle",
    arabic: "مقبرة المعلاة",
    descriptionKey: "makkahPlaceMuallaDesc",
    moreInfoQuery: "Jannat al-Mu'alla cemetery Makkah",
    lat: 21.4372,
    lng: 39.8289,
  },
  {
    id: "makkah-museum",
    titleKey: "makkahPlaceHistoryMuseumTitle",
    arabic: "متحف مكة · قصر الملك عبدالعزيز",
    descriptionKey: "makkahPlaceHistoryMuseumDesc",
    moreInfoQuery: "Makkah Museum King Abdulaziz Historical Center",
    lat: 21.4267,
    lng: 39.8256,
  },
]

export function getMakkahPlace(id: string): MakkahPlace | undefined {
  return MAKKAH_PLACES.find(p => p.id === id)
}
