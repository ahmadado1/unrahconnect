// Quran reading goals (Premium): finish a surah, a juz, or the whole Quran in a number of days.
//
// Progress is counted in Mushaf pages (604 in all), the same pages as Mushaf mode. Reading in
// Read mode counts too: every verse knows its page. A page counts once, even if read twice.
// The goal is saved on the phone and, when logged in, on the account (table quran_goals),
// so it survives a new phone. Guided reminders tell the user how many pages are left today.
import { JUZ_START_PAGES } from "./mushafJuz"
import { MUSHAF_PAGES, surahPageRange } from "./quranPages"
import { getSurahMeta } from "./quranSurahMeta"
import { safeStorage } from "./safeStorage"
import { supabase } from "./supabase"

export type GoalKind = "khatm" | "juz" | "surah"

export type QuranGoal = {
  id: string
  kind: GoalKind
  /** Surah or juz number (for kind surah / juz) */
  target?: number
  startPage: number
  endPage: number
  days: number
  /** YYYY-MM-DD (local) */
  startDate: string
  ramadan?: boolean
  /** Pages of the goal already read */
  read: number[]
  /** New pages read per day, YYYY-MM-DD → count */
  log: Record<string, number>
  completedAt?: string
}

const KEY = "quran_goal_v1"
let memory: { key: string; goal: QuranGoal | null } | null = null
const listeners = new Set<(goal: QuranGoal | null) => void>()

export function dayKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function daysBetween(fromKey: string, to = new Date()) {
  const [y, m, d] = fromKey.split("-").map(Number)
  const from = new Date(y, (m || 1) - 1, d || 1)
  const today = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((today.getTime() - from.getTime()) / 86400000)
}

async function storageKey() {
  try {
    const { data } = await supabase.auth.getSession()
    return `${KEY}:${data.session?.user.id ?? "guest"}`
  } catch {
    return `${KEY}:guest`
  }
}

async function save(goal: QuranGoal | null) {
  const key = await storageKey()
  memory = { key, goal }
  for (const fn of listeners) fn(goal)
  await safeStorage.setItem(key, JSON.stringify(goal)).catch(() => {})
  // Account copy (the table may not exist yet: the phone copy is enough).
  try {
    const { data } = await supabase.auth.getSession()
    const userId = data.session?.user.id
    if (!userId) return
    await supabase.from("quran_goals").upsert({ user_id: userId, goal, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
  } catch {}
}

/** The current goal (null if none). Finished goals stay until a new one is set, to show the result. */
export async function loadGoal(): Promise<QuranGoal | null> {
  const key = await storageKey()
  if (memory?.key === key) return memory.goal
  let goal: QuranGoal | null = null
  try {
    const raw = await safeStorage.getItem(key)
    goal = raw ? (JSON.parse(raw) as QuranGoal | null) : null
  } catch {}
  if (!goal) {
    try {
      const { data: s } = await supabase.auth.getSession()
      const userId = s.session?.user.id
      if (userId) {
        const { data } = await supabase.from("quran_goals").select("goal").eq("user_id", userId).maybeSingle()
        goal = (data?.goal as QuranGoal | null) ?? null
        if (goal) await safeStorage.setItem(key, JSON.stringify(goal)).catch(() => {})
      }
    } catch {}
  }
  memory = { key, goal }
  return goal
}

/** Screens listen here so the Home card updates while reading. */
export function onGoalChange(fn: (goal: QuranGoal | null) => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function juzPageRange(juz: number) {
  const j = Math.min(Math.max(1, Math.round(juz)), 30)
  const start = JUZ_START_PAGES[j - 1]
  const end = j < 30 ? JUZ_START_PAGES[j] - 1 : MUSHAF_PAGES
  return { start, end }
}

export async function startGoal(input: { kind: GoalKind; target?: number; days: number; ramadan?: boolean }) {
  const range =
    input.kind === "surah"
      ? surahPageRange(input.target ?? 1)
      : input.kind === "juz"
        ? juzPageRange(input.target ?? 1)
        : { start: 1, end: MUSHAF_PAGES }
  const goal: QuranGoal = {
    id: `${Date.now()}`,
    kind: input.kind,
    target: input.target,
    startPage: range.start,
    endPage: range.end,
    days: Math.max(1, Math.round(input.days)),
    startDate: dayKey(),
    ramadan: input.ramadan,
    read: [],
    log: {},
  }
  await save(goal)
  return goal
}

export async function endGoal() {
  await save(null)
}

/**
 * Mark pages as read (called by the Quran reader). Only pages inside the goal count.
 * Returns the goal and whether it was just finished.
 */
export async function markPagesRead(pages: number[]): Promise<{ goal: QuranGoal | null; justFinished: boolean }> {
  const goal = await loadGoal()
  if (!goal || goal.completedAt) return { goal, justFinished: false }
  const have = new Set(goal.read)
  const fresh = pages.filter(p => Number.isInteger(p) && p >= goal.startPage && p <= goal.endPage && !have.has(p))
  if (!fresh.length) return { goal, justFinished: false }
  const today = dayKey()
  const next: QuranGoal = {
    ...goal,
    read: [...goal.read, ...new Set(fresh)].sort((a, b) => a - b),
    log: { ...goal.log, [today]: (goal.log[today] ?? 0) + new Set(fresh).size },
  }
  const done = next.read.length >= next.endPage - next.startPage + 1
  if (done) next.completedAt = new Date().toISOString()
  await save(next)
  return { goal: next, justFinished: done }
}

export type GoalStats = {
  total: number
  readCount: number
  percent: number
  /** Day of the goal (1 = first day) */
  day: number
  daysLeft: number
  /** Pages to read today to stay on plan */
  todayTarget: number
  todayRead: number
  todayLeft: number
  /** First page of the goal not read yet (where "Continue" opens) */
  nextPage: number
  finished: boolean
  /** Behind the plan by more than one day of reading */
  behind: boolean
}

export function goalStats(goal: QuranGoal, now = new Date()): GoalStats {
  const total = goal.endPage - goal.startPage + 1
  const readCount = goal.read.length
  const elapsed = Math.max(0, daysBetween(goal.startDate, now))
  const day = elapsed + 1
  const daysLeft = Math.max(1, goal.days - elapsed)
  const todayRead = goal.log[dayKey(now)] ?? 0
  const remainingBeforeToday = Math.max(0, total - (readCount - todayRead))
  const todayTarget = Math.max(1, Math.ceil(remainingBeforeToday / daysLeft))
  const have = new Set(goal.read)
  let nextPage = goal.startPage
  while (nextPage <= goal.endPage && have.has(nextPage)) nextPage++
  if (nextPage > goal.endPage) nextPage = goal.endPage
  const expected = Math.min(total, Math.round((total / goal.days) * elapsed))
  return {
    total,
    readCount,
    percent: Math.min(100, Math.round((readCount / total) * 100)),
    day,
    daysLeft,
    todayTarget,
    todayRead,
    todayLeft: Math.max(0, todayTarget - todayRead),
    nextPage,
    finished: Boolean(goal.completedAt),
    behind: !goal.completedAt && readCount + Math.ceil(total / goal.days) < expected,
  }
}

/** Short name of the goal, e.g. "Al-Kahf", "Juz 30", "Whole Quran". */
export function goalLabel(goal: QuranGoal, t: (key: string, opts?: Record<string, unknown>) => string) {
  if (goal.kind === "surah") return getSurahMeta(goal.target ?? 1)?.englishName ?? t("qgSurah")
  if (goal.kind === "juz") return t("quranJuz", { number: goal.target ?? 1 })
  return goal.ramadan ? t("qgRamadanKhatm") : t("qgWholeQuran")
}
