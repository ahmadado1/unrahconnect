import { supabase } from "./supabase"
import {
  emptyLastReadState,
  registerLastRead,
  type LastReadEntry,
  type LastReadState,
} from "./lastReadRegister"
import { safeStorage } from "./safeStorage"

const LOCAL_KEY = "quran_last_read_v1"

let persistChain: Promise<LastReadState> = Promise.resolve(emptyLastReadState())
let memoryState: LastReadState | null = null

async function storageKey(): Promise<string> {
  try {
    const { data } = await supabase.auth.getSession()
    const userId = data.session?.user.id
    return userId ? `${LOCAL_KEY}:${userId}` : `${LOCAL_KEY}:guest`
  } catch {
    return `${LOCAL_KEY}:guest`
  }
}

function parseState(raw: string | null): LastReadState {
  if (!raw) return emptyLastReadState()
  try {
    const parsed = JSON.parse(raw) as LastReadState
    if (!Array.isArray(parsed?.entries)) return emptyLastReadState()
    return {
      entries: parsed.entries.filter(e => Number.isFinite(e?.surahNumber)),
      registrationCount: Number(parsed.registrationCount) || parsed.entries.length,
    }
  } catch {
    return emptyLastReadState()
  }
}

async function persist(state: LastReadState): Promise<void> {
  memoryState = state
  const key = await storageKey()
  await safeStorage.setItem(key, JSON.stringify(state))

  try {
    const { data } = await supabase.auth.getSession()
    const userId = data.session?.user.id
    if (!userId) return
    await supabase.from("quran_last_read").upsert(
      {
        user_id: userId,
        entries: state.entries,
        registration_count: state.registrationCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
  } catch {
    // Table may not exist yet — local storage is the source of truth.
  }
}

async function readStoredState(): Promise<LastReadState> {
  if (memoryState) return memoryState

  const key = await storageKey()
  const local = parseState(await safeStorage.getItem(key))
  if (local.entries.length) {
    memoryState = local
    return local
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user.id
    if (!userId) return local
    const { data } = await supabase
      .from("quran_last_read")
      .select("entries, registration_count")
      .eq("user_id", userId)
      .maybeSingle()
    if (!data) return local
    const remote: LastReadState = {
      entries: Array.isArray(data.entries) ? data.entries : [],
      registrationCount: Number(data.registration_count) || 0,
    }
    if (remote.entries.length) {
      memoryState = remote
      await safeStorage.setItem(key, JSON.stringify(remote))
      return remote
    }
    return local
  } catch {
    return local
  }
}

/** Wait for in-flight registrations so the Quran tab sees the latest exit. */
export async function loadLastReadState(): Promise<LastReadState> {
  await persistChain
  return readStoredState()
}

export async function recordQuranLastRead(
  entry: Omit<LastReadEntry, "registeredAt">,
): Promise<LastReadState> {
  persistChain = persistChain
    .then(async () => {
      if (!entry.surahNumber) return readStoredState()
      const current = await readStoredState()
      const next = registerLastRead(current, {
        ...entry,
        registeredAt: Date.now(),
      })
      await persist(next)
      return next
    })
    .catch(async () => readStoredState())
  return persistChain
}
