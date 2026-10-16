// React hook: the current Quran audio state (what is playing, which ayah, paused or not).
import { useEffect, useState } from "react"
import { getQuranPlayback, subscribeQuranPlayback, type QuranPlayback } from "./quranAudio"

export function useQuranPlayback(): QuranPlayback {
  const [playback, setPlayback] = useState<QuranPlayback>(getQuranPlayback())
  useEffect(() => subscribeQuranPlayback(setPlayback), [])
  return playback
}
