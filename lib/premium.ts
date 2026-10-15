// Premium in the app.
// The website sells Premium and writes "premium until <date>" into Supabase (user_premium).
// The app only READS it: no prices, no payment links (App Store / Play rules).
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useEffect, useState } from "react"
import { AppState } from "react-native"
import { supabase } from "./supabase"

const CACHE_KEY = "premium_until"

export type PremiumState = {
  isPremium: boolean
  /** "YYYY-MM-DD" or null */
  until: string | null
}

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function stateFrom(until: string | null): PremiumState {
  const day = until ? until.slice(0, 10) : null
  return { isPremium: Boolean(day && day >= todayKey()), until: day }
}

/** Last known answer, saved on the phone (works offline and in notification code). */
export async function readCachedPremium(): Promise<PremiumState> {
  try {
    return stateFrom(await AsyncStorage.getItem(CACHE_KEY))
  } catch {
    return stateFrom(null)
  }
}

/** Ask Supabase, then save the answer. If offline, falls back to the saved answer. */
export async function refreshPremium(): Promise<PremiumState> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      await AsyncStorage.removeItem(CACHE_KEY)
      return stateFrom(null)
    }
    const { data, error } = await supabase
      .from("user_premium")
      .select("premium_until")
      .eq("user_id", session.user.id)
      .maybeSingle()
    if (error) throw error
    const until = (data?.premium_until as string | null) ?? null
    const before = await AsyncStorage.getItem(CACHE_KEY)
    if (until) await AsyncStorage.setItem(CACHE_KEY, until)
    else await AsyncStorage.removeItem(CACHE_KEY)
    // Premium just started or ended: switch Mulk / Kahf reminders between simple and guided.
    if (stateFrom(before).isPremium !== stateFrom(until).isPremium) {
      const { scheduleAlKahfReminder, scheduleAlMulkReminder } = await import("./notifications")
      void scheduleAlMulkReminder().catch(() => {})
      void scheduleAlKahfReminder().catch(() => {})
    }
    return stateFrom(until)
  } catch (e) {
    console.log("[Premium] refresh failed, using saved value:", e)
    return readCachedPremium()
  }
}

/** For non-React code (notifications): is this user Premium right now? */
export async function isPremiumNow() {
  return (await readCachedPremium()).isPremium
}

/** React hook: { isPremium, until, refresh }. Re-checks when the app comes back to the front. */
export function usePremium() {
  const [state, setState] = useState<PremiumState>({ isPremium: false, until: null })

  const refresh = useCallback(async () => {
    const next = await refreshPremium()
    setState(next)
    return next
  }, [])

  useEffect(() => {
    let active = true
    readCachedPremium().then(saved => {
      if (active) setState(saved)
    })
    void refresh()
    const sub = AppState.addEventListener("change", s => {
      if (s === "active") void refresh()
    })
    return () => {
      active = false
      sub.remove()
    }
  }, [refresh])

  return { ...state, refresh }
}
