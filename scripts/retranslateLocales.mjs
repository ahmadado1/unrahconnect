import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const i18nDir = path.join(__dirname, "..", "i18n")
const DEEPL_KEY = "21bbc1fa-0c5f-49dc-b357-f6aeea1ee557:fx"
const DEEPL_LANG = { ar: "AR", fr: "FR", tr: "TR", ur: "UR" }
const BATCH_SIZE = 10

function loadJson(file) {
  return JSON.parse(fs.readFileSync(path.join(i18nDir, file), "utf8"))
}

function saveJson(file, data) {
  fs.writeFileSync(path.join(i18nDir, file), JSON.stringify(data, null, 2) + "\n")
}

async function translateBatch(texts, targetLang) {
  const params = new URLSearchParams()
  params.set("source_lang", "EN")
  params.set("target_lang", targetLang)
  for (const text of texts) params.append("text", text)

  const res = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
    },
    body: params.toString(),
  })

  const data = await res.json()
  if (!data.translations || data.translations.length !== texts.length) {
    throw new Error(`DeepL returned ${data.translations?.length ?? 0}/${texts.length}: ${JSON.stringify(data).slice(0, 200)}`)
  }
  return data.translations.map((t) => t.text)
}

async function retranslateLang(langFile, targetLang) {
  const en = loadJson("en.json")
  const loc = loadJson(langFile)
  const toTranslate = Object.keys(en).filter((k) => !(k in loc))
  console.log(`${langFile}: translating ${toTranslate.length} missing keys`)

  for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
    const batch = toTranslate.slice(i, i + BATCH_SIZE)
    const texts = batch.map((k) => en[k])
    try {
      const translated = await translateBatch(texts, targetLang)
      batch.forEach((key, idx) => {
        loc[key] = translated[idx]
      })
    } catch (err) {
      console.warn(`  batch ${i}-${i + batch.length} failed, falling back to English:`, err.message)
      batch.forEach((key) => {
        loc[key] = en[key]
      })
    }
    if ((i + BATCH_SIZE) % 100 === 0 || i + BATCH_SIZE >= toTranslate.length) {
      console.log(`  ${Math.min(i + BATCH_SIZE, toTranslate.length)}/${toTranslate.length}`)
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  saveJson(langFile, loc)
}

async function main() {
  for (const [file, lang] of Object.entries(DEEPL_LANG)) {
    await retranslateLang(`${file}.json`, lang)
  }
  console.log("Done.")
}

main().catch(console.error)
