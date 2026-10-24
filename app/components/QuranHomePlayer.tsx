// Picks the Quran player for Home and the Guide tab: Premium → big player, free → small player.
import QuranBigPlayer from "@/app/components/QuranBigPlayer"
import QuranMiniPlayer from "@/app/components/QuranMiniPlayer"
import { usePremium } from "@/lib/premium"

export default function QuranHomePlayer() {
  // Quran audio itself is free for everyone; the big player is Premium, free users get the small one.
  const { isPremium } = usePremium()
  return isPremium ? <QuranBigPlayer variant="home" /> : <QuranMiniPlayer />
}
