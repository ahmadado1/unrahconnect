// Premium in the app.
// Two ways to have Premium, the LATER date wins:
//  - Website payment (OPay, MyNita, PayPal): "premium_until" in Supabase (user_premium).
//  - In-app purchase (App Store / Google Play, via RevenueCat): "store_until" in Supabase,
//    plus the answer RevenueCat gives the phone right after buying (lib/purchases.ts).
// The app never shows website prices or payment links (App Store / Play rules).
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useEffect, useState } from "react"
import { AppState } from "react-native"
import { onStorePremiumChange, readStorePremiumUntil, refreshStorePremium } from "./purchases"
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

/** The later of two dates ("YYYY-MM-DD..." or null). */
function later(a: string | null, b: string | null) {
  const x = a ? a.slice(0, 10) : null
  const y = b ? b.slice(0, 10) : null
  if (!x) return y
  if (!y) return x
  return x > y ? x : y
}

/** Last known answer, saved on the phone (works offline and in notification code). */
export async function readCachedPremium(): Promise<PremiumState> {
  try {
    const [web, store] = await Promise.all([AsyncStorage.getItem(CACHE_KEY), readStorePremiumUntil()])
    return stateFrom(later(web, store))
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
    const before = (await readCachedPremium()).isPremium
    const [{ data, error }, storeLocal] = await Promise.all([
      supabase.from("user_premium").select("premium_until, store_until").eq("user_id", session.user.id).maybeSingle(),
      refreshStorePremium(),
    ])
    if (error) throw error
    // Website Premium, plus store Premium the server knows about (bought on another phone).
    const web = later((data?.premium_until as string | null) ?? null, (data?.store_until as string | null) ?? null)
    if (web) await AsyncStorage.setItem(CACHE_KEY, web)
    else await AsyncStorage.removeItem(CACHE_KEY)
    const until = later(web, storeLocal)
    // Premium just started or ended: switch Mulk / Kahf reminders between simple and guided.
    if (before !== stateFrom(until).isPremium) {
      const { scheduleAlKahfReminder, scheduleAlMulkReminder, scheduleSalawatReminder } = await import("./notifications")
      void scheduleAlMulkReminder().catch(() => {})
      void scheduleSalawatReminder().catch(() => {})
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
    // Just bought / restored in the app: show Premium at once.
    const off = onStorePremiumChange(() => {
      void readCachedPremium().then(next => active && setState(next))
    })
    return () => {
      active = false
      sub.remove()
      off()
    }
  }, [refresh])

  return { ...state, refresh }
}
