const fs = require('fs')

const content = fs.readFileSync('i18n/index.ts', 'utf8')

const languages = ['en', 'ar', 'bn', 'fr', 'ur', 'tr']

languages.forEach(lang => {
 // Find the translation object for each language
 const regex = new RegExp(`${lang}:\\s*\\{\\s*translation:\\s*(\\{[\\s\\S]*?\\})\\s*\\}\\s*,?`)
 const match = content.match(regex)
 
 if (match) {
 try {
 const obj = eval('(' + match[1] + ')')
 fs.writeFileSync(`i18n/${lang}.json`, JSON.stringify(obj, null, 2))
 console.log(` ${lang}.json — ${Object.keys(obj).length} keys`)
 } catch(e) {
 console.log(` ${lang} — parse error:`, e.message)
 }
 } else {
 console.log(` ${lang} — not found`)
 }
})