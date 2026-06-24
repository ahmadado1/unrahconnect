import AsyncStorage from "@react-native-async-storage/async-storage"
import { supabase } from "./supabase"

const REFERRAL_KEY = "pending_referral_code"

export function normalizeReferralCode(code: string) {
  return code.trim().toUpperCase()
}

export async function saveReferralCode(code: string) {
  const normalized = normalizeReferralCode(code)
  if (!normalized) return
  await AsyncStorage.setItem(REFERRAL_KEY, normalized)
}

export async function getPendingReferral() {
  return await AsyncStorage.getItem(REFERRAL_KEY)
}

export async function clearReferral() {
  await AsyncStorage.removeItem(REFERRAL_KEY)
}

export async function isValidReferralCode(referralCode: string): Promise<boolean> {
  const normalized = normalizeReferralCode(referralCode)
  if (!normalized) return false

  const { data } = await supabase
    .from("agents")
    .select("id")
    .eq("referral_code", normalized)
    .maybeSingle()

  return !!data
}

export async function pilgrimHasAgent(pilgrimId: string): Promise<boolean> {
  const { data } = await supabase
    .from("pilgrim_agent")
    .select("id")
    .eq("pilgrim_id", pilgrimId)
    .maybeSingle()

  return !!data
}

export async function linkPilgrimToAgent(referralCode: string): Promise<boolean> {
  try {
    const normalized = normalizeReferralCode(referralCode)
    if (!normalized) return false

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    if (await pilgrimHasAgent(user.id)) {
      await clearReferral()
      return true
    }

    const { data: agent } = await supabase
      .from("agents")
      .select("id")
      .eq("referral_code", normalized)
      .maybeSingle()

    if (!agent) return false

    const { error } = await supabase.from("pilgrim_agent").insert({
      pilgrim_id: user.id,
      agent_id: agent.id,
      referral_code: normalized,
    })

    if (error) {
      console.log("Link pilgrim error:", error.message)
      return false
    }

    await clearReferral()
    return true
  } catch (e) {
    console.log("Link pilgrim error:", e)
    return false
  }
}

/** Save pending code, or link immediately if user is already signed in. */
export async function applyAgentCode(code: string): Promise<boolean> {
  const normalized = normalizeReferralCode(code)
  if (!normalized) return false

  const valid = await isValidReferralCode(normalized)
  if (!valid) return false

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    return linkPilgrimToAgent(normalized)
  }

  await saveReferralCode(normalized)
  return true
}
