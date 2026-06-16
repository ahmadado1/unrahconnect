import AsyncStorage from "@react-native-async-storage/async-storage"
import { supabase } from "./supabase"

const REFERRAL_KEY = "pending_referral_code"

// Save referral code when app opens via deep link
export const saveReferralCode = async (code: string) => {
  await AsyncStorage.setItem(REFERRAL_KEY, code)
}

// Get saved referral code
export const getPendingReferral = async () => {
  return await AsyncStorage.getItem(REFERRAL_KEY)
}

// Clear referral code after linking
export const clearReferral = async () => {
  await AsyncStorage.removeItem(REFERRAL_KEY)
}

// Link pilgrim to agent after signup
export const linkPilgrimToAgent = async (referralCode: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Find agent by referral code
    const { data: agent } = await supabase
      .from("agents")
      .select("id")
      .eq("referral_code", referralCode)
      .single()

    if (!agent) return

    // Link pilgrim to agent
    await supabase.from("pilgrim_agent").insert({
      pilgrim_id: user.id,
      agent_id: agent.id,
      referral_code: referralCode,
    })

    console.log("Pilgrim linked to agent:", referralCode)
    await clearReferral()
  } catch (e) {
    console.log("Link pilgrim error:", e)
  }
}