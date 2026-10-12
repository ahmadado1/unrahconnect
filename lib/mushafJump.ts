/** How long to keep measuring a mushaf jump before giving up. */
export const MUSHAF_JUMP_RETRY_MS = 1000

export type MushafJump = {
  id: number
  surah: number
  ayah: number
  page: number
}

let jumpSeq = 0

/** Unique even when two taps happen in the same millisecond. */
export function createMushafJumpId() {
  jumpSeq = (jumpSeq + 1) % 1000
  return Date.now() * 1000 + jumpSeq
}

export function createMushafJump(input: { surah: number; ayah: number; page: number }): MushafJump {
  return { id: createMushafJumpId(), ...input }
}

export type MushafJumpStepInput = {
  elapsedMs: number
  /** Page verses are rendered and this page is the one on screen. */
  pageReady: boolean
  /** Target header or ayah view has a layout we can measure. */
  anchorMeasured: boolean
  /** y inside the page ScrollView content. Null when measure has not succeeded. */
  y: number | null
  /** Surah banner is the first block on the page. */
  startsAtTop: boolean
  /** Ayah 1 targets the surah header. A later ayah targets that verse. */
  toHeader: boolean
  /** Packed lines have their final heights, so y will not jump after the scroll. */
  paragraphsSettled: boolean
}

export type MushafJumpStep = "wait" | "give-up" | "skip-top" | "scroll"

/**
 * One frame of a jump. The caller clears the pending jump only for skip-top and scroll.
 * give-up stops the loop but keeps the jump so a later layout can try again.
 */
export function nextMushafJumpStep(input: MushafJumpStepInput): MushafJumpStep {
  if (input.pageReady && input.toHeader && input.startsAtTop) return "skip-top"

  const timedOut = input.elapsedMs >= MUSHAF_JUMP_RETRY_MS
  const layoutReady =
    input.pageReady &&
    input.paragraphsSettled &&
    input.anchorMeasured &&
    input.y != null &&
    input.y >= 1

  if (!layoutReady) return timedOut ? "give-up" : "wait"
  return "scroll"
}
