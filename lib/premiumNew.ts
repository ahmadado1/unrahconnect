// "What you got with Premium": after subscribing, the new Premium features glow until opened,
// and a short welcome guide lists them. Saved on the phone.
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useEffect, useState } from "react"

export type PremiumFeatureId = "goal" | "companion" | "miqat" | "widget" | "voices" | "trip"

export const PREMIUM_FEATURE_IDS: PremiumFeatureId[] = ["goal", "companion", "miqat", "widget", "voices", "trip"]

const NEW_KEY = "premium_new_features_v1"
const WELCOME_KEY = "premium_welcome_seen_v1"

let cache: Set<PremiumFeatureId> | null = null
const listeners = new Set<(s: Set<PremiumFeatureId>) => void>()

async function load(): Promise<Set<PremiumFeatureId>> {
  if (cache) return cache
  try {
    const raw = await AsyncStorage.getItem(NEW_KEY)
    cache = new Set(raw ? (JSON.parse(raw) as PremiumFeatureId[]) : [])
  } catch {
    cache = new Set()
  }
  return cache
}

async function save(next: Set<PremiumFeatureId>) {
  cache = next
  for (const fn of listeners) fn(next)
  await AsyncStorage.setItem(NEW_KEY, JSON.stringify([...next])).catch(() => {})
}

/**
 * Call when Premium becomes active. The first time, every Premium feature is marked "new"
 * and true is returned (show the welcome guide). Later calls return false.
 */
export async function startPremiumWelcome(): Promise<boolean> {
  const seen = await AsyncStorage.getItem(WELCOME_KEY).catch(() => null)
  if (seen === "1") return false
  await AsyncStorage.setItem(WELCOME_KEY, "1").catch(() => {})
  await save(new Set(PREMIUM_FEATURE_IDS))
  return true
}

/** The user opened this feature: stop the glow. */
export async function markFeatureSeen(id: PremiumFeatureId) {
  const s = new Set(await load())
  if (!s.delete(id)) return
  await save(s)
}

/** true while the feature should glow. */
export function useFeatureIsNew(id: PremiumFeatureId) {
  const [isNew, setIsNew] = useState(false)
  useEffect(() => {
    let alive = true
    void load().then(s => alive && setIsNew(s.has(id)))
    const fn = (s: Set<PremiumFeatureId>) => setIsNew(s.has(id))
    listeners.add(fn)
    return () => {
      alive = false
      listeners.delete(fn)
    }
  }, [id])
  const seen = useCallback(() => void markFeatureSeen(id), [id])
  return { isNew, seen }
}
