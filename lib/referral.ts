import AsyncStorage from "@react-native-async-storage/async-storage"
import { getAgentByCode, joinAgent, normalizeAgentCode } from "@/lib/agents"
import { getUserFast, supabase } from "./supabase"

const REFERRAL_KEY = "pending_referral_code"

export function normalizeReferralCode(code: string) {
  return normalizeAgentCode(code)
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
  try {
    const agent = await getAgentByCode(referralCode)
    return !!agent
  } catch {
    return false
  }
}

export async function pilgrimHasAgent(pilgrimId: string): Promise<boolean> {
  const { data } = await supabase
    .from("agent_pilgrims")
    .select("user_id")
    .eq("user_id", pilgrimId)
    .maybeSingle()

  return !!data
}

export async function linkPilgrimToAgent(referralCode: string): Promise<boolean> {
  try {
    const normalized = normalizeReferralCode(referralCode)
    if (!normalized) return false

    const { data: { user } } = await getUserFast()
    if (!user) return false

    if (await pilgrimHasAgent(user.id)) {
      await clearReferral()
      return true
    }

    // Existing profile and setup screens have no share toggle, and the
    // dashboard shows phone and email, so this path keeps sharing on.
    await joinAgent(normalized, true)
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

  const { data: { user } } = await getUserFast()
  if (user) {
    return linkPilgrimToAgent(normalized)
  }

  await saveReferralCode(normalized)
  return true
}
