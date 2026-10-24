// Quran reading goals (Premium): finish a surah, a juz, or the whole Quran in a number of days.
// A user can have several goals at the same time (for example Al-Kahf this week + a khatm).
//
// Progress is counted in Mushaf pages (604 in all), the same pages as Mushaf mode. Reading in
// Read mode counts too: every verse knows its page. A page counts once, even if read twice,
// and only after it was really on screen for a while (see the reader), so scrolling past
// pages never finishes a goal by itself.
//
// Daily goals ("Yasin every morning") never finish: every day starts fresh, and the goal keeps
// a streak of the days it was done.
//
// Time never finishes a goal: if the days run out, the goal stays where you stopped and is
// shown as "running late" until every page is read (or you end it).
//
// The goals are saved on the phone and, when logged in, on the account (table quran_goals,
// column goal), so they survive a new phone.
import { JUZ_START_PAGES } from "./mushafJuz"
import { MUSHAF_PAGES, surahPageRange } from "./quranPages"
import { getSurahMeta } from "./quranSurahMeta"
import { safeStorage } from "./safeStorage"
import { supabase } from "./supabase"

export type GoalKind = "khatm" | "juz" | "surah"
export type DailyTime = "morning" | "evening"

/** Daily goal state: today's pages, and the days it was fully read (for the streak). */
export type DailyState = {
  time: DailyTime
  /** YYYY-MM-DD the pages below belong to */
  day: string
  pages: number[]
  /** Days fully read, newest last (kept short) */
  done: string[]
}

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
  /** Set = a daily goal (read this surah every day) */
  daily?: DailyState
}

/** Most goals at the same time. */
export const MAX_GOALS = 5

const KEY_V1 = "quran_goal_v1"
const KEY = "quran_goals_v2"
let memory: { key: string; goals: QuranGoal[] } | null = null
const listeners = new Set<(goals: QuranGoal[]) => void>()

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

async function userId() {
  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.user.id ?? null
  } catch {
    return null
  }
}

function isGoal(value: unknown): value is QuranGoal {
  const g = value as QuranGoal
  return Boolean(g && typeof g === "object" && g.id && Number.isFinite(g.startPage) && Number.isFinite(g.endPage))
}

/** Read the account copy: new format { ...firstGoal, goals: [...] }, old format = one goal. */
function goalsFromAccount(value: unknown): QuranGoal[] {
  const v = value as (QuranGoal & { goals?: unknown[] }) | null
  if (!v) return []
  if (Array.isArray(v.goals)) return v.goals.filter(isGoal)
  return isGoal(v) ? [v] : []
}

async function save(goals: QuranGoal[]) {
  const uid = await userId()
  const key = `${KEY}:${uid ?? "guest"}`
  memory = { key, goals }
  for (const fn of listeners) fn(goals)
  await safeStorage.setItem(key, JSON.stringify(goals)).catch(() => {})
  // Account copy (the table may not exist yet: the phone copy is enough).
  // The first goal is kept at the top level too, so older app versions still show one goal.
  if (!uid) return
  try {
    const goal = goals.length ? { ...goals[0], goals } : null
    await supabase.from("quran_goals").upsert({ user_id: uid, goal, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
  } catch {}
}

/** All goals: running ones first (most urgent first), finished ones last. */
export async function loadGoals(): Promise<QuranGoal[]> {
  const uid = await userId()
  const key = `${KEY}:${uid ?? "guest"}`
  if (memory?.key === key) return memory.goals
  let goals: QuranGoal[] | null = null
  try {
    const raw = await safeStorage.getItem(key)
    if (raw) goals = (JSON.parse(raw) as unknown[]).filter(isGoal)
  } catch {}
  // Older app version saved one goal: move it into the list.
  if (!goals) {
    try {
      const raw = await safeStorage.getItem(`${KEY_V1}:${uid ?? "guest"}`)
      const old = raw ? JSON.parse(raw) : null
      if (isGoal(old)) goals = [old]
    } catch {}
  }
  if (!goals && uid) {
    try {
      const { data } = await supabase.from("quran_goals").select("goal").eq("user_id", uid).maybeSingle()
      goals = goalsFromAccount(data?.goal)
    } catch {}
  }
  goals = sortGoals(goals ?? [])
  memory = { key, goals }
  await safeStorage.setItem(key, JSON.stringify(goals)).catch(() => {})
  return goals
}

/** The most urgent running goal (or the last finished one), for places that show one goal. */
export async function loadGoal(): Promise<QuranGoal | null> {
  return (await loadGoals())[0] ?? null
}

/** Running goals first: late ones, then behind, then the rest; finished goals at the end. */
export function sortGoals(goals: QuranGoal[], now = new Date()) {
  const rank = (g: QuranGoal) => {
    const s = goalStats(g, now)
    if (s.finished) return 4
    if (s.overdue) return 0
    if (s.behind) return 1
    if (s.todayLeft > 0) return 2
    return 3
  }
  return [...goals].sort((a, b) => rank(a) - rank(b))
}

/** Screens listen here so the Home card updates while reading. */
export function onGoalsChange(fn: (goals: QuranGoal[]) => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/** Same as onGoalsChange, with only the most urgent goal. */
export function onGoalChange(fn: (goal: QuranGoal | null) => void) {
  return onGoalsChange(goals => fn(sortGoals(goals)[0] ?? null))
}

export function juzPageRange(juz: number) {
  const j = Math.min(Math.max(1, Math.round(juz)), 30)
  const start = JUZ_START_PAGES[j - 1]
  const end = j < 30 ? JUZ_START_PAGES[j] - 1 : MUSHAF_PAGES
  return { start, end }
}

/** True if a running goal for the same surah / juz / khatm already exists. */
export function sameGoal(
  a: { kind: GoalKind; target?: number; daily?: unknown },
  b: { kind: GoalKind; target?: number; daily?: unknown }
) {
  return a.kind === b.kind && Boolean(a.daily) === Boolean(b.daily) && (a.kind === "khatm" || a.target === b.target)
}

/**
 * Add a goal. A running goal for the same thing is replaced by the new one (fresh start);
 * finished goals are removed to make room when the list is full.
 */
export async function startGoal(input: {
  kind: GoalKind
  target?: number
  days: number
  ramadan?: boolean
  /** Set for a daily goal: when to remind */
  dailyTime?: DailyTime
}) {
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
    ...(input.dailyTime ? { daily: { time: input.dailyTime, day: dayKey(), pages: [], done: [] } } : {}),
  }
  const same = { kind: input.kind, target: input.target, daily: input.dailyTime }
  let goals = (await loadGoals()).filter(g => g.completedAt || !sameGoal(g, same))
  while (goals.length >= MAX_GOALS) {
    const finished = goals.findIndex(g => g.completedAt)
    if (finished < 0) break
    goals.splice(finished, 1)
  }
  goals = [...goals, goal]
  await save(sortGoals(goals))
  return goal
}

/** How many running (not finished) goals there are. */
export async function runningGoalCount() {
  return (await loadGoals()).filter(g => !g.completedAt).length
}

/** End (remove) one goal. Without an id: remove all goals. */
export async function endGoal(id?: string) {
  const goals = id ? (await loadGoals()).filter(g => g.id !== id) : []
  await save(goals)
}

/**
 * Mark pages as read (called by the Quran reader). Counts for every running goal that has the page.
 * Returns the goals and the ones that were just finished.
 */
export async function markPagesRead(
  pages: number[]
): Promise<{ goals: QuranGoal[]; finished: QuranGoal[]; doneToday: QuranGoal[] }> {
  const goals = await loadGoals()
  const wanted = [...new Set(pages.filter(p => Number.isInteger(p) && p >= 1 && p <= MUSHAF_PAGES))]
  if (!wanted.length) return { goals, finished: [], doneToday: [] }
  const today = dayKey()
  const finished: QuranGoal[] = []
  const doneToday: QuranGoal[] = []
  let changed = false
  const next = goals.map(goal => {
    if (goal.completedAt) return goal
    // Daily goal: count today's pages; when all are read, today is done (streak +1).
    if (goal.daily) {
      const state = goal.daily.day === today ? goal.daily : { ...goal.daily, day: today, pages: [] }
      if (state.done.includes(today)) return goal
      const have = new Set(state.pages)
      const fresh = wanted.filter(p => p >= goal.startPage && p <= goal.endPage && !have.has(p))
      if (!fresh.length) return goal
      changed = true
      const nextPages = [...state.pages, ...fresh].sort((a, b) => a - b)
      const complete = nextPages.length >= goal.endPage - goal.startPage + 1
      const updated: QuranGoal = {
        ...goal,
        log: { ...goal.log, [today]: (goal.log[today] ?? 0) + fresh.length },
        daily: { ...state, pages: nextPages, done: complete ? [...state.done, today].slice(-400) : state.done },
      }
      if (complete) doneToday.push(updated)
      return updated
    }
    const have = new Set(goal.read)
    const fresh = wanted.filter(p => p >= goal.startPage && p <= goal.endPage && !have.has(p))
    if (!fresh.length) return goal
    changed = true
    const updated: QuranGoal = {
      ...goal,
      read: [...goal.read, ...fresh].sort((a, b) => a - b),
      log: { ...goal.log, [today]: (goal.log[today] ?? 0) + fresh.length },
    }
    // Finished only when EVERY page of the goal is read.
    if (updated.read.length >= updated.endPage - updated.startPage + 1) {
      updated.completedAt = new Date().toISOString()
      finished.push(updated)
    }
    return updated
  })
  if (!changed) return { goals, finished: [], doneToday: [] }
  const sorted = sortGoals(next)
  await save(sorted)
  return { goals: sorted, finished, doneToday }
}

export type GoalStats = {
  total: number
  readCount: number
  /** Pages of the goal not read yet */
  remaining: number
  percent: number
  /** Day of the goal (1 = first day). Can be bigger than goal.days when running late. */
  day: number
  /** Days left, counting today (0 when the days are over) */
  daysLeft: number
  /** Pages to read today to stay on plan (all remaining pages when running late) */
  todayTarget: number
  todayRead: number
  todayLeft: number
  /** First page of the goal not read yet (where "Continue" opens) */
  nextPage: number
  finished: boolean
  /** Didn't keep up with the plan before today (e.g. day 1 passed with pages left) */
  behind: boolean
  /** All the days have passed and pages are still left */
  overdue: boolean
  /** Today is the last day of the goal */
  lastDay: boolean
}

export function goalStats(goal: QuranGoal, now = new Date()): GoalStats {
  if (goal.daily) return dailyStats(goal, now)
  const total = goal.endPage - goal.startPage + 1
  const readCount = Math.min(total, goal.read.length)
  const remaining = Math.max(0, total - readCount)
  const finished = Boolean(goal.completedAt) || remaining === 0
  const elapsed = Math.max(0, daysBetween(goal.startDate, now))
  const day = elapsed + 1
  const daysLeft = Math.max(0, goal.days - elapsed)
  const overdue = !finished && daysLeft === 0
  const todayRead = goal.log[dayKey(now)] ?? 0
  const remainingBeforeToday = Math.max(0, total - (readCount - todayRead))
  const todayTarget = overdue
    ? Math.max(1, remainingBeforeToday)
    : Math.max(1, Math.ceil(remainingBeforeToday / Math.max(1, daysLeft)))
  const have = new Set(goal.read)
  let nextPage = goal.startPage
  while (nextPage <= goal.endPage && have.has(nextPage)) nextPage++
  if (nextPage > goal.endPage) nextPage = goal.endPage
  // Pages the plan expected by the end of yesterday.
  const expectedByYesterday = Math.min(total, Math.round((total / goal.days) * elapsed))
  const readBeforeToday = readCount - todayRead
  return {
    total,
    readCount,
    remaining,
    percent: Math.min(100, Math.round((readCount / total) * 100)),
    day,
    daysLeft,
    todayTarget,
    todayRead,
    todayLeft: finished ? 0 : Math.max(0, Math.min(remaining, todayTarget - todayRead)),
    nextPage,
    finished,
    behind: !finished && !overdue && elapsed > 0 && readBeforeToday < expectedByYesterday,
    overdue,
    lastDay: !finished && daysLeft === 1,
  }
}

/** Daily goal: today's pages only. Never finished, never late: tomorrow starts fresh. */
function dailyStats(goal: QuranGoal, now: Date): GoalStats {
  const daily = goal.daily as DailyState
  const today = dayKey(now)
  const total = goal.endPage - goal.startPage + 1
  const pagesToday = daily.day === today ? daily.pages : []
  const doneToday = daily.done.includes(today)
  const readCount = doneToday ? total : Math.min(total, pagesToday.length)
  const remaining = Math.max(0, total - readCount)
  const have = new Set(pagesToday)
  let nextPage = goal.startPage
  while (nextPage <= goal.endPage && have.has(nextPage)) nextPage++
  if (nextPage > goal.endPage) nextPage = goal.startPage
  return {
    total,
    readCount,
    remaining,
    percent: Math.round((readCount / total) * 100),
    day: Math.max(0, daysBetween(goal.startDate, now)) + 1,
    daysLeft: 1,
    todayTarget: total,
    todayRead: readCount,
    todayLeft: remaining,
    nextPage,
    finished: false,
    behind: false,
    overdue: false,
    lastDay: false,
  }
}

/** Days in a row a daily goal was done (today counts once done; a missed yesterday resets it). */
export function goalStreak(goal: QuranGoal, now = new Date()) {
  if (!goal.daily) return 0
  const done = new Set(goal.daily.done)
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (!done.has(dayKey(day))) day.setDate(day.getDate() - 1)
  let streak = 0
  while (done.has(dayKey(day))) {
    streak++
    day.setDate(day.getDate() - 1)
  }
  return streak
}

/** "Every morning" / "Every evening" for daily goals, else the plan ("12 of 20 pages · day 2 of 3"). */
export function goalPlanLine(goal: QuranGoal, t: (key: string, opts?: Record<string, unknown>) => string, now = new Date()) {
  if (goal.daily) return goal.daily.time === "evening" ? t("qgD_everyEvening") : t("qgD_everyMorning")
  const s = goalStats(goal, now)
  if (s.finished) return t("qgFinished")
  return t("qgProgress", { read: s.readCount, total: s.total, day: Math.min(s.day, goal.days), days: goal.days })
}

/** Short name of the goal, e.g. "Al-Kahf", "Juz 30", "Whole Quran". */
export function goalLabel(goal: QuranGoal, t: (key: string, opts?: Record<string, unknown>) => string) {
  if (goal.kind === "surah") return getSurahMeta(goal.target ?? 1)?.englishName ?? t("qgSurah")
  if (goal.kind === "juz") return t("quranJuz", { number: goal.target ?? 1 })
  return goal.ramadan ? t("qgRamadanKhatm") : t("qgWholeQuran")
}

/** One line about where the goal stands, for cards and the goals list. */
export function goalStatusLine(goal: QuranGoal, t: (key: string, opts?: Record<string, unknown>) => string, now = new Date()) {
  const s = goalStats(goal, now)
  if (goal.daily) {
    const streak = goalStreak(goal, now)
    if (s.todayLeft <= 0) return t("qgD_doneToday", { streak })
    return streak > 0 ? t("qgD_leftStreak", { count: s.todayLeft, streak }) : t("qgD_left", { count: s.todayLeft })
  }
  if (s.finished) return t("qgFinished")
  if (s.overdue) return t("qgLateLine", { count: s.remaining, days: goal.days })
  if (s.todayLeft <= 0) return t("qgTodayDone")
  if (s.behind) return t("qgBehindLine", { count: s.todayLeft })
  return t("qgTodayLeft", { count: s.todayLeft })
}
