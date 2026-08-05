export type MadinahPlaceSubItem = {
  titleKey: string
  descriptionKey: string
}

export type MadinahPlace = {
  number: string
  titleKey: string
  descriptionKey: string
  crucial?: boolean
  citationKey?: string
  subItems?: MadinahPlaceSubItem[]
}

export const MADINAH_PLACES: MadinahPlace[] = [
  {
    number: "1",
    titleKey: "madinahPlace1Title",
    descriptionKey: "madinahPlace1Desc",
    crucial: true,
    citationKey: "madinahPlace1Citation",
  },
  {
    number: "2",
    titleKey: "madinahPlace2Title",
    descriptionKey: "madinahPlace2Desc",
    crucial: true,
    citationKey: "madinahPlace2Citation",
  },
  {
    number: "3",
    titleKey: "madinahPlace3Title",
    descriptionKey: "madinahPlace3Desc",
    crucial: true,
    subItems: [
      {
        titleKey: "madinahPlace3SubTitle",
        descriptionKey: "madinahPlace3SubDesc",
      },
    ],
  },
  {
    number: "4",
    titleKey: "madinahPlace4Title",
    descriptionKey: "madinahPlace4Desc",
    citationKey: "madinahPlace4Citation",
  },
  {
    number: "5",
    titleKey: "madinahPlace5Title",
    descriptionKey: "madinahPlace5Desc",
    crucial: true,
    citationKey: "madinahPlace5Citation",
  },
  {
    number: "6",
    titleKey: "madinahPlace6Title",
    descriptionKey: "madinahPlace6Desc",
  },
  {
    number: "7",
    titleKey: "madinahPlace7Title",
    descriptionKey: "madinahPlace7Desc",
  },
  {
    number: "8",
    titleKey: "madinahPlace8Title",
    descriptionKey: "madinahPlace8Desc",
  },
  {
    number: "9",
    titleKey: "madinahPlace10Title",
    descriptionKey: "madinahPlace10Desc",
    citationKey: "madinahPlace10Citation",
  },
  {
    number: "10",
    titleKey: "madinahPlace9Title",
    descriptionKey: "madinahPlace9Desc",
    subItems: [
      {
        titleKey: "madinahPlace9Sub1Title",
        descriptionKey: "madinahPlace9Sub1Desc",
      },
      {
        titleKey: "madinahPlace9Sub2Title",
        descriptionKey: "madinahPlace9Sub2Desc",
      },
      {
        titleKey: "madinahPlace9Sub3Title",
        descriptionKey: "madinahPlace9Sub3Desc",
      },
    ],
  },
]
