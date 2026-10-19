// Picks the Quran player for Home and the Guide tab: Premium → big player, free → small player.
import { QURAN_AUDIO_FREE } from "@/lib/quranAudio"
import QuranBigPlayer from "@/app/components/QuranBigPlayer"
import QuranMiniPlayer from "@/app/components/QuranMiniPlayer"
import { usePremium } from "@/lib/premium"

export default function QuranHomePlayer() {
  const { isPremium: hasPremium } = usePremium()
  // Quran audio is free for everyone (QURAN_AUDIO_FREE), otherwise Premium only.
  const isPremium = hasPremium || QURAN_AUDIO_FREE
  return isPremium ? <QuranBigPlayer variant="home" /> : <QuranMiniPlayer />
}
