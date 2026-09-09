import { describe, expect, test } from "bun:test"
import { normalizeSearchText } from "./searchNormalize"
import { searchSurahs, type SearchableSurah } from "./surahSearch"

const SURAHS: SearchableSurah[] = [
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
  return searchSurahs(query, SURAHS)[0]?.englishName ?? ""
}

describe("normalizeSearchText", () => {
  test("strips articles, punctuation, and diacritics so Al-Baqarah matches Baqarah", () => {
    expect(normalizeSearchText("Al-Baqarah")).toBe(normalizeSearchText("Baqarah"))
    expect(normalizeSearchText("Al-Baqarah")).toBe(normalizeSearchText("al baqarah"))
    expect(normalizeSearchText("Ash-Shu'araa")).toBe("shuaraa")
    expect(normalizeSearchText("An-Nisa'")).toBe("nisa")
  })
})

describe("searchSurahs", () => {
  test("matches Al-Baqarah by transliteration, article, meaning, number, and typo", () => {
    for (const query of ["baqarah", "al baqarah", "Al-Baqarah", "the cow", "2", "baqra"]) {
      expect(topName(query)).toBe("Al-Baqarah")
    }
  })

  test("treats kahf and al kahf as the same hit", () => {
    expect(topName("kahf")).toBe("Al-Kahf")
    expect(topName("al kahf")).toBe("Al-Kahf")
    expect(topName("Al-Kahf")).toBe("Al-Kahf")
  })

  test("ranks exact normalized matches above contains matches", () => {
    expect(searchSurahs("kahf", SURAHS)[0]?.englishName).toBe("Al-Kahf")
  })

  test("returns the original list when the query is empty", () => {
    expect(searchSurahs("  ", SURAHS).length).toBe(SURAHS.length)
  })
})
