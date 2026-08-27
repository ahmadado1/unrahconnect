import AsyncStorage from "@react-native-async-storage/async-storage"

/**
 * Metro's web/SSR bundle can constant-fold `typeof window`, so never use that
 * as a runtime guard. `globalThis.window` is a real property lookup.
 */
export function isDomAvailable() {
  try {
    return typeof globalThis.window !== "undefined" && globalThis.window != null
  } catch {
    return false
  }
}

const memory: Record<string, string> = {}

/** AsyncStorage-compatible store that never touches `window` during Node SSR. */
export const safeStorage = {
  getItem: async (key: string) => {
    if (!isDomAvailable()) return memory[key] ?? null
    try {
      return await AsyncStorage.getItem(key)
    } catch {
      return memory[key] ?? null
    }
  },
  setItem: async (key: string, value: string) => {
    memory[key] = value
    if (!isDomAvailable()) return
    try {
      await AsyncStorage.setItem(key, value)
    } catch {
      // keep memory copy
    }
  },
  removeItem: async (key: string) => {
    delete memory[key]
    if (!isDomAvailable()) return
    try {
      await AsyncStorage.removeItem(key)
    } catch {
      // ignore
    }
  },
}
