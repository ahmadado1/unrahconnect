export type StepVariant = "default" | "talbiyah-stop" | "black-stone" | "yamani-dua"

export type PhaseStepMeta = {
  crucial?: boolean
  menOnly?: boolean
  womenOnly?: boolean
  noteKey?: string
  variant?: StepVariant
}

/** journey → phase id → 0-based step index → display metadata */
export const PHASE_STEP_META: Record<
  string,
  Record<string, Record<number, PhaseStepMeta>>
> = {
  umrah: {
    "2": {
      7: { crucial: true },
    },
    "3": {
      4: { crucial: true },
      5: { crucial: true, variant: "talbiyah-stop" },
      7: { crucial: true, variant: "black-stone" },
    },
    "4": {
      1: { menOnly: true, noteKey: "phaseUmrah4Step2Note" },
      5: { menOnly: true },
      7: { variant: "yamani-dua" },
    },
    "5": {
      5: { menOnly: true },
      8: { crucial: true },
    },
    "6": {
      1: { menOnly: true },
      3: { womenOnly: true },
      4: { crucial: true },
    },
    "7": {
      0: { crucial: true },
      6: { crucial: true },
    },
  },
  hajj: {
    "1": {
      5: { menOnly: true },
      6: { menOnly: true },
      10: { crucial: true },
    },
    "2": {
      0: { crucial: true },
    },
    "4": {
      3: { crucial: true },
      6: { crucial: true },
    },
    "6": {
      1: { crucial: true },
      2: { crucial: true },
      6: { menOnly: true },
      9: { crucial: true },
      11: { crucial: true },
    },
    "8": {
      0: { crucial: true },
      2: { crucial: true },
      5: { crucial: true },
    },
  },
}

export function getStepMeta(
  journey: "umrah" | "hajj",
  phaseId: string,
  index: number,
): PhaseStepMeta {
  return PHASE_STEP_META[journey]?.[phaseId]?.[index] ?? {}
}

export function stepTitleKey(stepKey: string): string {
  return `${stepKey}Title`
}

export function stepBadgeKey(stepKey: string): string {
  return `${stepKey}Badge`
}
