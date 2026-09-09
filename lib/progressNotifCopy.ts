export const UMRAH_JOURNEY_PHASES = 7
export const HAJJ_JOURNEY_PHASES = 9

export type JourneyNotifKind = "start" | "continue" | "finish" | "skip"
export type KahfNotifSlot = "Thu" | "FriAm" | "FriEve"
export type KahfNotifKind = "start" | "dontMiss" | "continue" | "finish" | "skip"
export type MulkNotifKind = "start" | "continue" | "finish" | "skip"

export function journeyNotifKind(completedCount: number, total: number): JourneyNotifKind {
  const done = Math.max(0, Number(completedCount) || 0)
  const all = Math.max(0, Number(total) || 0)
  if (all <= 0 || done >= all) return "skip"
  if (done <= 0) return "start"
  if (done >= all - 1) return "finish"
  return "continue"
}

export function kahfHasStarted(progress: { verseNumber: number; completed: boolean }): boolean {
  return Boolean(progress.completed) || (Number(progress.verseNumber) || 0) > 0
}

/**
 * Thursday night is always a heads-up to start tomorrow.
 * Friday morning/evening follow this week's Kahf progress.
 */
export function kahfNotifKind(
  slot: KahfNotifSlot,
  progress: { verseNumber: number; completed: boolean },
): KahfNotifKind {
  if (slot === "Thu") return "start"
  if (progress.completed) return "skip"
  const started = kahfHasStarted(progress)
  if (slot === "FriAm") return started ? "continue" : "dontMiss"
  return started ? "finish" : "dontMiss"
}

export function isSameLocalDay(ms: number, now = new Date()): boolean {
  const d = new Date(ms)
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export function mulkNotifKind(input: {
  lastAyah: number | null
  ayahCount: number
  readToday: boolean
}): MulkNotifKind {
  if (!input.readToday || input.lastAyah == null || input.lastAyah < 1) return "start"
  if (input.lastAyah >= input.ayahCount) return "skip"
  if (input.lastAyah >= Math.max(1, input.ayahCount - 3)) return "finish"
  return "continue"
}

/** Next occurrence of weekday (0 Sun … 6 Sat) at hour:minute local time. */
export function nextWeekdayAt(
  weekday: number,
  hour: number,
  minute: number,
  now = new Date(),
): Date {
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0)
  const add = (weekday - now.getDay() + 7) % 7
  target.setDate(target.getDate() + add)
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 7)
  return target
}
