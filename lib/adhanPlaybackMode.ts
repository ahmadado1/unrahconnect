import AsyncStorage from "@react-native-async-storage/async-storage"

const KEY = "adhan_playback_mode"

/** Alarm rings on silent for about 30 seconds. Full chains the whole Adhan when the ringer is on. */
export type AdhanPlaybackMode = "alarm" | "full"

export async function getAdhanPlaybackMode(): Promise<AdhanPlaybackMode> {
  const raw = await AsyncStorage.getItem(KEY)
  return raw === "alarm" ? "alarm" : "full"
}

export async function setAdhanPlaybackMode(mode: AdhanPlaybackMode) {
  await AsyncStorage.setItem(KEY, mode)
}
