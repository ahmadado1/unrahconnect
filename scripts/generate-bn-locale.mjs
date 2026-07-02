import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..", "i18n")
const enPath = path.join(root, "en.json")
const bnPath = path.join(root, "bn.json")

const en = JSON.parse(fs.readFileSync(enPath, "utf8"))
const keys = Object.keys(en)

let bn = {}
if (fs.existsSync(bnPath)) {
  bn = JSON.parse(fs.readFileSync(bnPath, "utf8"))
}

// Merge any valid partial chunks
for (let i = 0; i < 6; i++) {
  const chunkPath = path.join(root, `_bn_chunk_${i}.json`)
  if (!fs.existsSync(chunkPath)) continue
  try {
    const chunk = JSON.parse(fs.readFileSync(chunkPath, "utf8"))
    bn = { ...bn, ...chunk }
  } catch {
    console.warn(`Skipping invalid chunk ${i}`)
  }
}

const ARABIC_RE = /[\u0600-\u06FF]/
const SKIP_RE = [/^https?:\/\//, /^\{\{/]

function shouldSkip(text) {
  if (!text || typeof text !== "string") return true
  return SKIP_RE.some((re) => re.test(text))
}

async function translate(text) {
  if (ARABIC_RE.test(text) && (text.match(ARABIC_RE) || []).length > text.length * 0.35) {
    return text
  }
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=bn&dt=t&q=" +
    encodeURIComponent(text)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data[0].map((part) => part[0]).join("")
}

function save() {
  fs.writeFileSync(bnPath, JSON.stringify(bn, null, 2) + "\n", "utf8")
}

let done = 0
for (const key of keys) {
  if (bn[key] && bn[key] !== en[key]) {
    done++
    continue
  }
  const val = en[key]
  if (shouldSkip(val)) {
    bn[key] = val
  } else {
    let attempts = 0
    while (attempts < 3) {
      try {
        bn[key] = await translate(val)
        break
      } catch (e) {
        attempts++
        console.warn(`Retry ${key}: ${e.message}`)
        await new Promise((r) => setTimeout(r, 1000 * attempts))
        if (attempts >= 3) bn[key] = val
      }
    }
    await new Promise((r) => setTimeout(r, 80))
  }
  done++
  if (done % 25 === 0) {
    save()
    console.log(`Progress: ${done}/${keys.length}`)
  }
}

save()
console.log(`Done: ${Object.keys(bn).length} keys → ${bnPath}`)
