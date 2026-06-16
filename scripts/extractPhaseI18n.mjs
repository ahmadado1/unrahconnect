#!/usr/bin/env node
/**
 * Extracts translatable English strings from Umrah/Hajj phase detail screens
 * and emits flat i18n keys plus a refactored structure map.
 *
 * Usage: node scripts/extractPhaseI18n.mjs
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

const SOURCES = [
  {
    kind: "Umrah",
    prefix: "phaseUmrah",
    file: path.join(ROOT, "app/umrah/[phase].tsx"),
  },
  {
    kind: "Hajj",
    prefix: "phaseHajj",
    file: path.join(ROOT, "app/hajj/[hajj].tsx"),
  },
]

const OUTPUT_DIR = path.join(ROOT, "scripts/output")
const STRINGS_FILE = path.join(OUTPUT_DIR, "phaseI18n.en.json")
const STRUCTURE_FILE = path.join(OUTPUT_DIR, "phaseStructure.json")

function parsePhasesData(filePath) {
  const content = fs.readFileSync(filePath, "utf8")
  const match = content.match(/const phasesData = (\[[\s\S]*?\n\])\s*\n\s*const phaseOrder/)
  if (!match) {
    throw new Error(`Could not find phasesData array in ${filePath}`)
  }

  // Safe eval: source files only contain static object literals
  // eslint-disable-next-line no-eval
  return eval(`(${match[1]})`)
}

function buildPhaseKeys(prefix, phase) {
  const n = phase.id
  const base = `${prefix}${n}`
  const strings = {}
  const structure = {
    id: phase.id,
    color: phase.color,
    textColor: phase.textColor,
    durationKey: `${base}Duration`,
    descriptionKey: `${base}Description`,
    stepsKeys: [],
    duas: [],
    tipsKeys: [],
  }

  strings[`${base}Duration`] = phase.duration
  strings[`${base}Description`] = phase.description

  if (phase.femaleNote) {
    structure.femaleNoteKey = `${base}FemaleNote`
    strings[`${base}FemaleNote`] = phase.femaleNote
  }

  phase.steps.forEach((step, i) => {
    const key = `${base}Step${i + 1}`
    structure.stepsKeys.push(key)
    strings[key] = step
  })

  phase.duas.forEach((dua, i) => {
    const idx = i + 1
    const titleKey = `${base}Dua${idx}Title`
    const translationKey = `${base}Dua${idx}Translation`

    structure.duas.push({
      titleKey,
      arabic: dua.arabic,
      transliteration: dua.transliteration,
      translationKey,
    })

    strings[titleKey] = dua.title
    strings[translationKey] = dua.translation
  })

  phase.tips.forEach((tip, i) => {
    const key = `${base}Tip${i + 1}`
    structure.tipsKeys.push(key)
    strings[key] = tip
  })

  return { strings, structure, counts: countPhaseKeys(structure) }
}

function countPhaseKeys(structure) {
  const counts = {
    duration: 1,
    description: 1,
    femaleNote: structure.femaleNoteKey ? 1 : 0,
    steps: structure.stepsKeys.length,
    duaTitles: structure.duas.length,
    duaTranslations: structure.duas.length,
    tips: structure.tipsKeys.length,
  }
  counts.total =
    counts.duration +
    counts.description +
    counts.femaleNote +
    counts.steps +
    counts.duaTitles +
    counts.duaTranslations +
    counts.tips
  return counts
}

function main() {
  const allStrings = {}
  const structure = { umrah: [], hajj: [] }
  const summary = {}

  for (const source of SOURCES) {
    const phases = parsePhasesData(source.file)
    const sectionKey = source.kind.toLowerCase()

    for (const phase of phases) {
      const { strings, structure: phaseStructure, counts } = buildPhaseKeys(
        source.prefix,
        phase,
      )

      Object.assign(allStrings, strings)
      structure[sectionKey].push(phaseStructure)
      summary[`${source.prefix}${phase.id}`] = counts
    }
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.writeFileSync(STRINGS_FILE, JSON.stringify(allStrings, null, 2) + "\n")
  fs.writeFileSync(STRUCTURE_FILE, JSON.stringify(structure, null, 2) + "\n")

  const totals = Object.values(summary).reduce(
    (acc, c) => {
      acc.phases += 1
      acc.keys += c.total
      return acc
    },
    { phases: 0, keys: 0 },
  )

  console.log("Phase i18n extraction complete\n")
  console.log("Key counts per phase:")
  for (const [phaseKey, counts] of Object.entries(summary)) {
    console.log(
      `  ${phaseKey}: ${counts.total} keys (duration: 1, description: 1, femaleNote: ${counts.femaleNote}, steps: ${counts.steps}, duaTitles: ${counts.duaTitles}, duaTranslations: ${counts.duaTranslations}, tips: ${counts.tips})`,
    )
  }
  console.log(`\nTotal: ${totals.phases} phases, ${totals.keys} keys`)
  console.log(`\nStrings:   ${STRINGS_FILE}`)
  console.log(`Structure: ${STRUCTURE_FILE}`)
}

main()
