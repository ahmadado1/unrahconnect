// Cloud backup of the user's settings, so reinstalling or changing phone doesn't lose them.
//
// How it works (no change needed in each feature):
//   * SYNC_KEYS lists the phone-saved settings worth keeping (favourite reciters, Quran listening
//     spot, fonts, prayer tracker, alert choices, my duas, tasbih, trip plan, ...).
//   * PUSH: every few minutes, when the app goes to the background, and after login, we compare
//     those settings with what we last sent; changed ones are saved to the user's row in
//     Supabase (table user_settings) with the time they changed.
//   * PULL: after login and on app start, settings from the account fill in anything missing on
//     the phone, or replace older values (the newest change wins). A different account on the
//     same phone always gets its own settings back.
// Things already saved to the account elsewhere (Quran bookmarks, goals, last-read place,
// per-surah progress, hotel favourites, Umrah/Hajj progress) are not repeated here.
import AsyncStorage from "@react-native-async-storage/async-storage"
import { supabase, getUserFast } from "./supabase"

export const SYNC_KEYS = [
  // Quran
  "quran_fav_reciters_v1",
  "quran_listen_reciter",
  "quran_verse_reciter",
  "quran_listen_spot_v1",
  "quran_last_read_v1",
  "quran_read_mode",
  "quran_translation_size_v1",
  "mushaf_font",
  "mushaf_font_size_v1",
  "kahf_weekly_progress_v1",
  "mulk_nightly_progress_v1",
  // Prayer
  "prayer_completion_log_v1",
  "prayer_alerts_off_v1",
  "prayer_alerts_quiet_v1",
  "prayer_alerts_enabled",
  "selectedAdhan",
  "selected_adhan",
  "notifications_enabled",
  "islamic_dates_enabled",
  "adhkar_morning_enabled",
  "adhkar_morning_hour",
  "adhkar_morning_minute",
  "adhkar_evening_enabled",
  "adhkar_evening_hour",
  "adhkar_evening_minute",
  // Dhikr & duas
  "my_duas_v1",
  "tasbih_count",
  "tasbih_daily_total",
  "tasbih_date",
  "tasbih_dhikr_index",
  // Trip
  "trip_plan_v1",
  "trip_details_v1",
  "makkah_stay_v1",
  "featured_hotel_favorites_v1",
  // App
  "language",
  "darkMode",
  "start_guide_done_v1",
] as const

// Saved per item: tafsir choice per language (tafsir_choice_v2_<lang>) and the reciter chosen
// for Al-Kahf / Al-Mulk listening cards (isolated_reciter_<surah>).
const SYNC_PREFIXES = ["tafsir_choice_v2_", "isolated_reciter_"]

const SNAPSHOT_KEY = "cloud_sync_snapshot_v1" // { key: value } as last sent/received
const OWNER_KEY = "cloud_sync_owner_v1" // which account the phone last synced with
const PUSH_EVERY_MS = 5 * 60 * 1000

type Entry = { v: string | null; t: number }
type CloudData = Record<string, Entry>

let running: Promise<void> | null = null
let lastPush = 0

async function readLocal(): Promise<Record<string, string | null>> {
  const all = await AsyncStorage.getAllKeys().catch(() => [] as readonly string[])
  const prefixed = all.filter(k => SYNC_PREFIXES.some(p => k.startsWith(p)))
  const keys = [...SYNC_KEYS, ...prefixed]
  const pairs = await AsyncStorage.multiGet(keys)
  return Object.fromEntries(pairs)
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

/**
 * Pull from the account, then push local changes. Safe to call often:
 * only one runs at a time, and pushes are skipped when nothing changed.
 */
export function syncSettings(opts: { force?: boolean } = {}): Promise<void> {
  if (running) return running
  running = runSync(opts).finally(() => {
    running = null
  })
  return running
}

async function runSync({ force }: { force?: boolean }) {
  try {
    const { data: { user } } = await getUserFast()
    if (!user) return

    const { data: row, error } = await supabase
      .from("user_settings")
      .select("data")
      .eq("user_id", user.id)
      .maybeSingle()
    if (error) {
      console.log("[CloudSync] read failed:", error.message)
      return
    }
    const cloud: CloudData = ((row?.data as CloudData | null) ?? {}) as CloudData

    const owner = await AsyncStorage.getItem(OWNER_KEY)
    const switchedAccount = owner !== user.id
    const snapshot = switchedAccount ? {} : await readJson<Record<string, string | null>>(SNAPSHOT_KEY, {})
    const local = await readLocal()
    const now = Date.now()

    // 1. What changed on this phone since the last sync?
    //    (A different account on this phone: nothing local is pushed, the account's settings win.)
    const changedHere = new Set<string>()
    if (!switchedAccount) {
      for (const [key, value] of Object.entries(local)) {
        if (value !== (snapshot[key] ?? null)) changedHere.add(key)
      }
    }

    // 2. PULL: take the account's value when the phone didn't change it since the last sync
    //    (or the phone has nothing for it).
    const toSet: [string, string][] = []
    const toRemove: string[] = []
    for (const [key, entry] of Object.entries(cloud)) {
      if (!entry || changedHere.has(key)) continue
      const isKnown = (SYNC_KEYS as readonly string[]).includes(key) || SYNC_PREFIXES.some(p => key.startsWith(p))
      if (!isKnown) continue
      if ((local[key] ?? null) === entry.v) continue
      if (entry.v === null) toRemove.push(key)
      else toSet.push([key, entry.v])
      local[key] = entry.v
    }
    if (toSet.length) await AsyncStorage.multiSet(toSet)
    if (toRemove.length) await AsyncStorage.multiRemove(toRemove)

    // 3. PUSH: send what changed here (newest change wins).
    let next = cloud
    if (changedHere.size || (force && !row)) {
      next = { ...cloud }
      for (const key of changedHere) {
        const prev = cloud[key]
        if (prev && prev.t > now) continue
        next[key] = { v: local[key] ?? null, t: now }
      }
      if (!row) {
        // First backup for this account: send everything the phone has.
        for (const [key, value] of Object.entries(local)) {
          if (value !== null && !next[key]) next[key] = { v: value, t: now }
        }
      }
      const { error: upErr } = await supabase
        .from("user_settings")
        .upsert({ user_id: user.id, data: next, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
      if (upErr) {
        console.log("[CloudSync] save failed:", upErr.message)
        return
      }
      lastPush = now
    }

    // 4. Remember what the phone and the account now agree on.
    await AsyncStorage.multiSet([
      [SNAPSHOT_KEY, JSON.stringify(local)],
      [OWNER_KEY, user.id],
    ])
    if (toSet.length || toRemove.length) {
      console.log(`[CloudSync] restored ${toSet.length + toRemove.length} settings from the account`)
    }
  } catch (e) {
    console.log("[CloudSync] error:", e)
  }
}

/** For the timer: push at most every 5 minutes. */
export function syncSettingsIfDue() {
  if (Date.now() - lastPush < PUSH_EVERY_MS) return
  void syncSettings()
}
