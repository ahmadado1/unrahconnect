// Gets one photo per hotel from its Booking.com page and saves them in lib/hotelPhotos.json.
// The app then shows these photos on the hotel cards (lib/hotelCatalog.ts).
//
// Run it on your Mac from the UmrahConnect folder (needs normal internet):
//   node scripts/fetch-hotel-photos.mjs
// Run it again after adding hotels: hotels that already have a photo are skipped.
import { readFileSync, writeFileSync, existsSync } from "node:fs"

const OUT = "lib/hotelPhotos.json"
const files = ["lib/moreHotels.ts", "lib/featuredHotels.ts"]

// 1. Every Booking.com hotel page name ("slug") used in the app.
const slugs = new Set()
for (const f of files) {
  const text = decodeURIComponent(readFileSync(f, "utf8"))
  for (const m of text.matchAll(/booking\.com\/hotel\/sa\/([a-z0-9-]+)\.html/g)) slugs.add(m[1])
  // rows in moreHotels.ts: [..., "slug"],
  if (f.endsWith("moreHotels.ts")) for (const m of text.matchAll(/"([a-z0-9-]+)"\],/g)) slugs.add(m[1])
}

const photos = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {}
const todo = [...slugs].filter(s => !photos[s])
console.log(`${slugs.size} hotels, ${todo.length} need a photo`)

const sleep = ms => new Promise(r => setTimeout(r, ms))
const headers = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "en-GB,en;q=0.9",
}

let found = 0
for (const slug of todo) {
  try {
    const res = await fetch(`https://www.booking.com/hotel/sa/${slug}.html`, { headers, redirect: "follow" })
    const html = await res.text()
    // The main photo: og:image, or else the first large hotel photo on the page.
    let url =
      html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)?.[1] ??
      html.match(/https:\/\/cf\.bstatic\.com\/xdata\/images\/hotel\/max1024x768\/[^"'\s)]+/)?.[0]
    if (url) {
      url = url.replace(/&amp;/g, "&").replace(/\/max\d+(x\d+)?\//, "/max1024x768/")
      photos[slug] = url
      found++
      console.log("✓", slug)
    } else {
      console.log("✗", slug, `(status ${res.status}, no photo found)`)
    }
  } catch (e) {
    console.log("✗", slug, String(e))
  }
  await sleep(1200) // be polite to Booking.com
}

writeFileSync(OUT, JSON.stringify(photos, null, 2) + "\n")
console.log(`Done: ${found} new photos. Saved ${Object.keys(photos).length} in ${OUT}`)
