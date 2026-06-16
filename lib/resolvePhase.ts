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
}

export type ResolvedPhase = {
  id: string
  color: string
  textColor: string
  title: string
  duration: string
  description: string
  steps: string[]
  duas: {
    title: string
    arabic: string
    transliteration: string
    translation: string
  }[]
  tips: string[]
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
    duas: phase.duas.map((dua) => ({
      title: t(dua.titleKey),
      arabic: dua.arabic,
      transliteration: dua.transliteration,
      translation: t(dua.translationKey),
    })),
    tips: phase.tipsKeys.map((key) => t(key)),
    femaleNote: phase.femaleNoteKey ? t(phase.femaleNoteKey) : undefined,
  }
}
