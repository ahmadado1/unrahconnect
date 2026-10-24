import { isAdhanPlaying, isAdhanPreviewPlaying } from "@/lib/adhanAudio"
import { PRAYER_NAMES } from "@/lib/prayerConstants"
import { readCachedPrayerTimes, timeToMinutes } from "@/lib/prayerTimes"
import { supabaseUrl } from "@/lib/supabase"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as StoreReview from "expo-store-review"
import { Linking, Platform } from "react-native"

const STORAGE_KEY = "store_review_v1"
const DAY_MS = 24 * 60 * 60 * 1000
const TWO_DAYS_MS = 2 * DAY_MS
const TWO_WEEKS_MS = 14 * DAY_MS
const TWO_MONTHS_MS = 60 * DAY_MS
const YEAR_MS = 365 * DAY_MS
const PRAYER_WINDOW_MINUTES = 15

const APP_STORE_URL = "https://apps.apple.com/app/id6778753426"
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.myumrahconnect.app"

type ReviewState = {
  firstOpenAt: number
  openCount: number
  asks: number[]
  stopped: boolean
}

const emptyState = (): ReviewState => ({
  firstOpenAt: 0,
  openCount: 0,
  asks: [],
  stopped: false,
})

type CardListener = (visible: boolean) => void
const cardListeners = new Set<CardListener>()
let chain: Promise<void> = Promise.resolve()
let prompting = false

function enqueue(task: () => Promise<void>) {
  const run = chain.then(task, task)
  chain = run.then(() => {}, () => {})
  return run
}

async function readState(): Promise<ReviewState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<ReviewState>
    return {
      firstOpenAt: Number(parsed.firstOpenAt) || 0,
      openCount: Number(parsed.openCount) || 0,
      asks: Array.isArray(parsed.asks) ? parsed.asks.filter(t => Number.isFinite(t)) : [],
      stopped: parsed.stopped === true,
    }
  } catch {
    return emptyState()
  }
}

async function writeState(state: ReviewState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function recentAsks(state: ReviewState, now: number) {
  return state.asks.filter(askedAt => now - askedAt < YEAR_MS)
}

function isDue(state: ReviewState, now: number) {
  if (state.stopped || state.firstOpenAt <= 0) return false
  const asks = recentAsks(state, now)
  if (asks.length >= 3) return false
  if (asks.length === 0) {
    return state.openCount >= 5 && now - state.firstOpenAt >= TWO_DAYS_MS
  }
  const sinceLast = now - asks[asks.length - 1]
  if (asks.length === 1) return sinceLast >= TWO_WEEKS_MS
  return sinceLast >= TWO_MONTHS_MS
}

async function isOnline() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 2500)
  try {
    const res = await fetch(supabaseUrl, { method: "GET", signal: controller.signal })
    return res.status > 0
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

/** True from a prayer time until the usual prayer window ends. Sunrise is not a prayer. */
async function isDuringPrayer(now = new Date()) {
  const cached = await readCachedPrayerTimes()
  if (!cached) return false
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return PRAYER_NAMES.some(name => {
    const start = timeToMinutes(cached[name])
    if (start < 0) return false
    const elapsed = nowMinutes - start
    return elapsed >= 0 && elapsed < PRAYER_WINDOW_MINUTES
  })
}

function showCard(visible: boolean) {
  cardListeners.forEach(listener => listener(visible))
}

export function subscribeStoreReviewCard(listener: CardListener) {
  cardListeners.add(listener)
  return () => {
    cardListeners.delete(listener)
  }
}

export function recordAppOpen() {
  return enqueue(async () => {
    const state = await readState()
    const now = Date.now()
    await writeState({
      ...state,
      firstOpenAt: state.firstOpenAt > 0 ? state.firstOpenAt : now,
      openCount: state.openCount + 1,
    })
  })
}

/**
 * Ask at a happy moment when the schedule allows.
 * `adhan` is the moment the Adhan has just closed, so the prayer window does not block it.
 * iOS shows the system dialog only. Android opens the bottom card.
 */
export function considerStoreReview(source: "happy" | "adhan" = "happy") {
  if (prompting) return Promise.resolve()
  prompting = true
  return enqueue(async () => {
    try {
      if (isAdhanPlaying() || isAdhanPreviewPlaying()) return
      if (!(await StoreReview.isAvailableAsync())) return
      if (source !== "adhan" && (await isDuringPrayer())) return
      if (!(await isOnline())) return
      const now = Date.now()
      const state = await readState()
      if (!isDue(state, now)) return
      const asks = [...recentAsks(state, now), now]
      await writeState({
        ...state,
        asks,
        stopped: asks.length >= 3,
      })
      if (Platform.OS === "ios") {
        await StoreReview.requestReview()
        return
      }
      showCard(true)
    } finally {
      prompting = false
    }
  })
}

export async function rateFromPrompt() {
  showCard(false)
  if (!(await StoreReview.isAvailableAsync())) return
  await StoreReview.requestReview()
}

export function dismissStoreReviewCard() {
  showCard(false)
}

/**
 * Settings / Me "Rate UmrahConnect": shows the rating pop-up inside the app (Apple / Google).
 * Also stops the automatic prompts, since the user asked to rate.
 * Apple and Google decide how often the pop-up may appear (and it never shows in TestFlight /
 * internal testing), so if it can't be shown we open the store page instead.
 */
export async function openStoreListing() {
  await enqueue(async () => {
    const state = await readState()
    await writeState({ ...state, stopped: true })
  })
  showCard(false)
  try {
    if ((await StoreReview.isAvailableAsync()) && (await StoreReview.hasAction())) {
      await StoreReview.requestReview()
      return
    }
  } catch (e) {
    console.log("[Review] In-app pop-up failed, opening the store:", e)
  }
  const url = (await StoreReview.storeUrl()) || (Platform.OS === "ios" ? APP_STORE_URL : PLAY_STORE_URL)
  await Linking.openURL(url)
}
