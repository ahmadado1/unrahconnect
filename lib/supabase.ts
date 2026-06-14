import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://yqabuipymbaylholmmoi.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxYWJ1aXB5bWJheWxob2xtbW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDc3ODIsImV4cCI6MjA5MzcyMzc4Mn0.tJly9kx4fdBzuNcyaM11ELLbu51q3AI8d2Vnq2LkYr0"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

const isInvalidSessionError = (message: string) =>
  message.includes("Refresh Token") ||
  message.includes("Invalid Refresh Token") ||
  message.includes("JWT")

export async function clearLocalAuth() {
  await AsyncStorage.removeItem("cached_user")
  await supabase.auth.signOut({ scope: "local" })
}

export async function getValidSession() {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    if (isInvalidSessionError(error.message)) {
      await clearLocalAuth()
    }
    return null
  }

  return session
}

// Clear stale tokens on startup before auto-refresh throws
supabase.auth.getSession().then(({ error }) => {
  if (error && isInvalidSessionError(error.message)) {
    clearLocalAuth()
  }
}).catch(() => {})

// Checks if a specific item is already in the user's favorites
export const isFavorite = async (itemId: string, itemType: string) => {
  // Get the currently logged in user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // Search favorites table for a row matching this user, item and type
  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("item_id", String(itemId))
    .eq("item_type", itemType)
    .maybeSingle()

  if (error) {
    console.error("isFavorite error:", error.message)
    return false
  }

  // If data exists it means it's already a favorite
  return !!data
}

// Adds or removes a favorite depending on current state
export const toggleFavorite = async (itemId: string, itemType: string) => {
  // Get the currently logged in user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // Check if already favorited
  const already = await isFavorite(itemId, itemType)

  if (already) {
    // Already a favorite — remove it from the table
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("item_id", String(itemId))
      .eq("item_type", itemType)

    if (error) {
      console.error("toggleFavorite delete error:", error.message)
      return true
    }
  } else {
    // Not a favorite yet — add it to the table
    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: user.id, item_id: String(itemId), item_type: itemType })

    if (error) {
      console.error("toggleFavorite insert error:", error.message)
      return false
    }
  }

  // Return the new state — true if now favorited, false if removed
  return !already
}

// Gets all completed phase ids for the current user
export const getUmrahProgress = async () => {
  // Get logged in user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get all completed phases for this user
  const { data } = await supabase
    .from("umrah_progress")
    .select("phase_id")
    .eq("user_id", user.id)

  // Return just the phase ids as an array like ["1", "2", "3"]
  return (data ?? []).map(row => row.phase_id)
}

// Marks a phase as complete or incomplete (toggles)
export const markPhaseComplete = async (phaseId: string) => {
  // Get logged in user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Check if already completed
  const { data } = await supabase
    .from("umrah_progress")
    .select("id")
    .eq("user_id", user.id)
    .eq("phase_id", phaseId)
    .single()

  if (data) {
    // Already completed — remove it (unmark)
    await supabase
      .from("umrah_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("phase_id", phaseId)
    return false // Now incomplete
  } else {
    // Not completed — add it (mark as done)
    await supabase
      .from("umrah_progress")
      .insert({ user_id: user.id, phase_id: phaseId })
    return true // Now complete
  }
}



// Gets all completed Hajj phase ids for the current user
export const getHajjProgress = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("hajj_progress")
    .select("phase_id")
    .eq("user_id", user.id)

  return (data ?? []).map(row => row.phase_id)
}

export const markHajjPhaseComplete = async (phaseId: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data } = await supabase
    .from("hajj_progress")
    .select("id")
    .eq("user_id", user.id)
    .eq("phase_id", phaseId)
    .single()

  if (data) {
    await supabase.from("hajj_progress").delete().eq("user_id", user.id).eq("phase_id", phaseId)
    return false
  } else {
    await supabase.from("hajj_progress").insert({ user_id: user.id, phase_id: phaseId })
    return true
  }
}
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    AsyncStorage.setItem("cached_user", JSON.stringify(session.user))
  } else {
    AsyncStorage.removeItem("cached_user")
  }
})