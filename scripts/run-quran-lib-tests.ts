import { emptyLastReadState, registerLastRead, type LastReadEntry } from "../lib/lastReadRegister"
import { normalizeSearchText } from "../lib/searchNormalize"
import { searchSurahs, type SearchableSurah } from "../lib/surahSearch"
import { resolveHomeQuranCard } from "../lib/homeQuranCard"

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a !== e) {
    throw new Error(`${label}\n  expected: ${e}\n  actual:   ${a}`)
  }
}

function entry(surahNumber: number): LastReadEntry {
  return {
    surahNumber,
    englishName: `Surah ${surahNumber}`,
    arabicName: "",
    ayah: 1,
    registeredAt: surahNumber,
  }
}

{
  let state = emptyLastReadState()
  state = registerLastRead(state, entry(1))
  state = registerLastRead(state, entry(1))
  assertEqual(state.entries.map(e => e.surahNumber), [1, 1], "no-dedupe")
  assertEqual(state.registrationCount, 2, "count after two same-surah reads")
}

{
  let state = emptyLastReadState()
  for (const n of [1, 2, 3, 4, 5]) state = registerLastRead(state, entry(n))
  assertEqual(state.entries.map(e => e.surahNumber), [5, 4, 3, 2, 1], "five entries newest first")
}

{
  let state = emptyLastReadState()
  for (const n of [1, 2, 3, 4, 5]) state = registerLastRead(state, entry(n))
  state = registerLastRead(state, entry(99))
  assertEqual(state.entries.map(e => e.surahNumber), [99], "reset on 6th registration")
  assertEqual(state.registrationCount, 1, "count after reset")
}

{
  let state = emptyLastReadState()
  for (let n = 1; n <= 10; n++) state = registerLastRead(state, entry(n))
  assertEqual(state.entries.map(e => e.surahNumber), [10, 9, 8, 7, 6], "rebuild after reset")
  state = registerLastRead(state, entry(11))
  assertEqual(state.entries.map(e => e.surahNumber), [11], "second reset cycle")
}

assertEqual(normalizeSearchText("Al-Baqarah"), normalizeSearchText("Baqarah"), "article strip")
assertEqual(normalizeSearchText("Al-Baqarah"), normalizeSearchText("al baqarah"), "spaced article")
assertEqual(normalizeSearchText("Ash-Shu'araa"), "shuaraa", "shuaraa")
assertEqual(normalizeSearchText("An-Nisa'"), "nisa", "nisa")

const surahs: SearchableSurah[] = [
  { number: 1, englishName: "Al-Fatihah", englishNameTranslation: "The Opening" },
  { number: 2, englishName: "Al-Baqarah", englishNameTranslation: "The Cow" },
  { number: 4, englishName: "An-Nisa", englishNameTranslation: "The Women" },
  { number: 18, englishName: "Al-Kahf", englishNameTranslation: "The Cave" },
  { number: 26, englishName: "Ash-Shu'ara", englishNameTranslation: "The Poets" },
  { number: 36, englishName: "Ya-Sin", englishNameTranslation: "Ya Sin" },
  { number: 55, englishName: "Ar-Rahman", englishNameTranslation: "The Beneficent" },
  { number: 67, englishName: "Al-Mulk", englishNameTranslation: "The Sovereignty" },
]

function topName(query: string): string {
  return searchSurahs(query, surahs)[0]?.englishName ?? ""
}

for (const query of ["baqarah", "al baqarah", "Al-Baqarah", "the cow", "2", "baqra"]) {
  assertEqual(topName(query), "Al-Baqarah", `search: ${query}`)
}
assertEqual(topName("kahf"), "Al-Kahf", "kahf")
assertEqual(topName("al kahf"), "Al-Kahf", "al kahf")
assertEqual(topName("Al-Kahf"), "Al-Kahf", "Al-Kahf")
assertEqual(searchSurahs("  ", surahs).length, surahs.length, "empty query")

{
  const fridayNight = new Date(2026, 8, 11, 22, 15, 0) // Friday 10:15pm
  const mulk = resolveHomeQuranCard({
    now: fridayNight,
    lastRead: { surahNumber: 36, englishName: "Ya-Sin", arabicName: "", ayah: 12, registeredAt: 1 },
    kahfAyah: 40,
  })
  assertEqual(mulk.kind, "mulk", "friday night prefers Mulk")
  assertEqual(mulk.surahNumber, 67, "mulk surah")
}

{
  const fridayMorning = new Date(2026, 8, 11, 10, 0, 0)
  const kahf = resolveHomeQuranCard({
    now: fridayMorning,
    lastRead: { surahNumber: 36, englishName: "Ya-Sin", arabicName: "", ayah: 12, registeredAt: 1 },
    kahfAyah: 40,
  })
  assertEqual(kahf.kind, "kahf", "friday day shows Kahf")
  assertEqual(kahf.ayah, 40, "kahf resumes weekly ayah")
}

{
  const saturdayLateNight = new Date(2026, 8, 12, 2, 0, 0)
  assertEqual(resolveHomeQuranCard({ now: saturdayLateNight }).kind, "mulk", "2am still Mulk window")
}

{
  const wednesday = new Date(2026, 8, 9, 15, 0, 0)
  const resume = resolveHomeQuranCard({
    now: wednesday,
    lastRead: { surahNumber: 36, englishName: "Ya-Sin", arabicName: "يس", ayah: 20, registeredAt: 1 },
  })
  assertEqual(resume.kind, "resume", "weekday uses last read")
  assertEqual(resume.surahNumber, 36, "yaseen")
  assertEqual(resume.ayah, 20, "stopped ayah")
}

{
  const wednesday = new Date(2026, 8, 9, 15, 0, 0)
  const fresh = resolveHomeQuranCard({ now: wednesday })
  assertEqual(fresh.surahNumber, 1, "default fatihah")
  assertEqual(fresh.ayah, 1, "default ayah 1")
}

import "../lib/progressNotifCopy.test"

console.log("quran lib tests passed")
