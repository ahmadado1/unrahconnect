/**
 * UmrahConnect Auto-Translator
 * 
 * HOW TO USE:
 * 1. Put this file in the root of your project (next to package.json)
 * 2. Run: node translate.js
 * 3. It will update i18n.ts automatically with all translations
 * 
 * It only translates keys that are missing or have changed in English.
 * Arabic is skipped (you write it manually — too important to auto-translate).
 */

const fs = require("fs");
const path = require("path");

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const I18N_FILE = "./i18n/index.ts"; // path to your i18n file

const LANGUAGES = {
  fr: "en|fr",
  ur: "en|ur",
  tr: "en|tr",
  // ar is intentionally skipped — keep manual Arabic
};

const DELAY_MS = 300; // delay between API calls to avoid rate limiting

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function translateText(text, langPair) {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.responseStatus === 200) {
      return data.responseData.translatedText;
    } else {
      console.warn(`  ⚠️  API warning for "${text}": ${data.responseDetails}`);
      return null;
    }
  } catch (err) {
    console.error(`  ❌ Failed to translate "${text}":`, err.message);
    return null;
  }
}

function extractTranslations(fileContent) {
  const result = {};
  const langRegex = /(\w{2}):\s*\{\s*translation:\s*\{([\s\S]*?)\}\s*\}/g;
  let match;

  while ((match = langRegex.exec(fileContent)) !== null) {
    const lang = match[1];
    const block = match[2];
    const keys = {};
    const keyRegex = /(\w+):\s*"((?:[^"\\]|\\.)*)"/g;
    let keyMatch;
    while ((keyMatch = keyRegex.exec(block)) !== null) {
      keys[keyMatch[1]] = keyMatch[2];
    }
    result[lang] = keys;
  }

  return result;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌍 UmrahConnect Auto-Translator\n");

  if (!fs.existsSync(I18N_FILE)) {
    console.error(`❌ Could not find ${I18N_FILE}`);
    process.exit(1);
  }

  let fileContent = fs.readFileSync(I18N_FILE, "utf8");
  const translations = extractTranslations(fileContent);
  const enKeys = translations["en"] || {};

  if (!Object.keys(enKeys).length) {
    console.error("❌ Could not parse English translations");
    process.exit(1);
  }

  console.log(`✅ Found ${Object.keys(enKeys).length} English keys\n`);

  for (const [lang, langPair] of Object.entries(LANGUAGES)) {
    const existing = translations[lang] || {};
    const missing = Object.entries(enKeys).filter(
      ([key, val]) => !existing[key] || existing[key] === enKeys[key]
    );

    if (!missing.length) {
      console.log(`✅ ${lang.toUpperCase()} — already up to date`);
      continue;
    }

    console.log(`\n🔄 Translating ${missing.length} keys to ${lang.toUpperCase()}...`);

    const newTranslations = { ...existing };
    let count = 0;

    for (const [key, value] of missing) {
      process.stdout.write(`  [${++count}/${missing.length}] ${key}... `);
      const translated = await translateText(value, langPair);

      if (translated) {
        newTranslations[key] = translated;
        console.log(`✓`);
      } else {
        newTranslations[key] = value;
        console.log(`⚠️  kept English`);
      }

      await sleep(DELAY_MS);
    }

    const block = Object.entries(newTranslations)
      .map(([k, v]) => `      ${k}: "${v.replace(/"/g, '\\"')}",`)
      .join("\n");

    const langBlock = `  ${lang}: {\n    translation: {\n${block}\n    }\n  }`;

    const langBlockRegex = new RegExp(
      `  ${lang}:\\s*\\{\\s*translation:\\s*\\{[\\s\\S]*?\\}\\s*\\}`,
      "g"
    );

    if (langBlockRegex.test(fileContent)) {
      fileContent = fileContent.replace(langBlockRegex, langBlock);
    }

    fs.writeFileSync(I18N_FILE, fileContent, "utf8");
    console.log(`✅ ${lang.toUpperCase()} done!`);
  }

  console.log(`\n🎉 Done! ${I18N_FILE} has been updated.\n`);
}

main();