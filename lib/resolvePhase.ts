import type { TFunction } from "i18next"

export type PhaseStructure = {
  id: string
  color: string
  textColor: string
  durationKey: string
  descriptionKey: string
  stepsKeys: string[]
  duas: {
    titleKey: string
    arabic: string
    transliteration: string
    translationKey: string
  }[]
  tipsKeys: string[]
  femaleNoteKey?: string
  stepsSupplements?: ({
    arabic?: string
    transliterationKey?: string
    translationKey?: string
    citationKey?: string
  } | null)[]
  tipsSupplements?: ({
    arabic?: string
    transliterationKey?: string
    translationKey?: string
    citationKey?: string
  } | null)[]
}

export type ResolvedPhase = {
  id: string
  color: string
  textColor: string
  title: string
  duration: string
  description: string
  steps: string[]
  stepDetails?: ({
    arabic?: string
    transliteration?: string
    translation?: string
    citation?: string
  } | undefined)[]
  duas: {
    title: string
    arabic: string
    transliteration: string
    translation: string
  }[]
  tips: {
    text: string
    arabic?: string
    transliteration?: string
    translation?: string
    citation?: string
  }[]
  femaleNote?: string
}

export function resolvePhase(
  phase: PhaseStructure,
  t: TFunction,
  titleKey: string,
): ResolvedPhase {
  return {
    id: phase.id,
    color: phase.color,
    textColor: phase.textColor,
    title: t(titleKey),
    duration: t(phase.durationKey),
    description: t(phase.descriptionKey),
    steps: phase.stepsKeys.map((key) => t(key)),
    stepDetails: phase.stepsSupplements?.map((supplement) =>
      supplement
        ? {
            arabic: supplement.arabic,
            transliteration: supplement.transliterationKey
              ? t(supplement.transliterationKey)
              : undefined,
            translation: supplement.translationKey
              ? t(supplement.translationKey)
              : undefined,
            citation: supplement.citationKey
              ? t(supplement.citationKey)
              : undefined,
          }
        : undefined,
    ),
    duas: phase.duas.map((dua) => ({
      title: t(dua.titleKey),
      arabic: dua.arabic,
      transliteration: dua.transliteration,
      translation: t(dua.translationKey),
    })),
    tips: phase.tipsKeys.map((key, index) => {
      const supplement = phase.tipsSupplements?.[index]
      return {
        text: t(key),
        arabic: supplement?.arabic,
        transliteration: supplement?.transliterationKey
          ? t(supplement.transliterationKey)
          : undefined,
        translation: supplement?.translationKey
          ? t(supplement.translationKey)
          : undefined,
        citation: supplement?.citationKey
          ? t(supplement.citationKey)
          : undefined,
      }
    }),
    femaleNote: phase.femaleNoteKey ? t(phase.femaleNoteKey) : undefined,
  }
}
