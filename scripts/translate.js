const https = require("https")
const fs = require("fs")

const DEEPL_API_KEY = "21bbc1fa-0c5f-49dc-b357-f6aeea1ee557:fx"

const LANGUAGES = {
 ar: "AR",
 fr: "FR",
 tr: "TR",
}

async function translate(text, targetLang) {
 if (!text || text.length < 2) return text

 return new Promise((resolve) => {
 const params = new URLSearchParams({
 auth_key: DEEPL_API_KEY,
 text,
 source_lang: "EN",
 target_lang: targetLang,
 }).toString()

 const options = {
 hostname: "api-free.deepl.com",
 path: "/v2/translate",
 method: "POST",
 headers: {
 "Content-Type": "application/x-www-form-urlencoded",
 "Content-Length": Buffer.byteLength(params),
 },
 }

 const req = https.request(options, (res) => {
 let data = ""
 res.on("data", (chunk) => data += chunk)
 res.on("end", () => {
 try {
 const json = JSON.parse(data)
 resolve(json.translations?.[0]?.text || text)
 } catch {
 resolve(text)
 }
 })
 })
 req.on("error", () => resolve(text))
 req.write(params)
 req.end()
 })
}

async function run() {
 const base = JSON.parse(fs.readFileSync("i18n/en.json", "utf8"))

 for (const [lang, deepLCode] of Object.entries(LANGUAGES)) {
 console.log(`\nTranslating to ${lang}...`)

 const existingPath = `i18n/${lang}.json`
 const existing = fs.existsSync(existingPath)
 ? JSON.parse(fs.readFileSync(existingPath, "utf8"))
 : {}

 const result = { ...existing }
 const missingKeys = Object.keys(base).filter(k => !existing[k])
 console.log(` ${missingKeys.length} missing keys`)

 if (missingKeys.length === 0) {
 console.log(" Already up to date!")
 continue
 }

 for (const key of missingKeys) {
 const translated = await translate(base[key], deepLCode)
 result[key] = translated
 process.stdout.write(".")
 await new Promise(r => setTimeout(r, 100))
 }

 fs.writeFileSync(existingPath, JSON.stringify(result, null, 2))
 console.log(`\n Saved ${lang}.json`)
 }

 console.log("\n Done!")
}

run().catch(console.error)