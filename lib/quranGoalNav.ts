// Open the Quran reader at the next unread page of the goal.
import { goalStats, type QuranGoal } from "./quranGoals"
import { surahForPage } from "./quranPages"
import { getQuranReadMode } from "./quranReadMode"
import { getSurahMeta } from "./quranSurahMeta"
import { createMushafJumpId } from "./mushafJump"

export async function goalReaderHref(goal: QuranGoal) {
  const page = goalStats(goal).nextPage
  const surah = surahForPage(page)
  const meta = getSurahMeta(surah)
  const mode = (await getQuranReadMode()) ?? "mushaf"
  return {
    pathname: "/quran/[surah]" as const,
    params: {
      surah: String(surah),
      name: meta?.englishName ?? "",
      arabicName: meta?.arabicName ?? "",
      verses: String(meta?.ayahCount ?? 1),
      type: meta?.revelationType ?? "Meccan",
      page: String(page),
      resume: "0",
      mode,
      jump: String(createMushafJumpId()),
    },
  }
}
