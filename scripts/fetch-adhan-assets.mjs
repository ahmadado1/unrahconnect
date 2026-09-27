/**
 * Pulls the Adhan library into assets/adhan and builds the short lock-screen
 * clips used by notifications and the iOS 26 alarm.
 *
 * Primary library: https://www.assabile.com/adhan-call-prayer
 * Direct files below were taken from that page's public media links.
 *
 * Fajr tracks must include «الصلاة خير من النوم». The script uses the
 * dedicated Fajr listings for Mishary Rashid Alafasy, Abdul Basit Abdus Samad,
 * and Ahmad Al-Trablsy. The other Fajr files are called out in `note` when
 * Assabile does not credit that sheikh on a Fajr take. Replace any of those
 * mp3s in assets/adhan and run this script again to rebuild the lock clips.
 *
 * Full playback stays .mp3 (iOS and Android via expo-audio).
 * The alarm / notification tone is a 25s .wav (Apple's limit is 30s) plus a
 * .caf copy for AlarmKit. Do not put the full Adhan on the alarm sound.
 *
 * Usage: node scripts/fetch-adhan-assets.mjs
 */
import { execFileSync } from "node:child_process"
import { mkdir, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const OUT_DIR = path.join(ROOT, "assets", "adhan")
const LOCK_SECONDS = 25

/** @type {Array<{
 *   id: string
 *   file: string
 *   title: string
 *   url: string
 *   fajr: boolean
 *   note: string
 * }>} */
const TRACKS = [
  {
    id: "alafasy",
    file: "adhan_alafasy.mp3",
    title: "Mishary Rashid Alafasy — Adhan Al Kuwait (04:17)",
    url: "https://media.assabile.com/assabile/adhan_3435370/e9ab8052fdb8.mp3",
    fajr: false,
    note: "Kuwaiti daytime Adhan. Library: https://www.assabile.com/adhan-call-prayer",
  },
  {
    id: "alafasy",
    file: "adhan_alafasy_fajr.mp3",
    title: "Mishary Rashid Alafasy — Adhan Al Fajr Al Kuwait (04:48)",
    url: "https://media.assabile.com/assabile/adhan_3435370/b91e1c5095cd.mp3",
    fajr: true,
    note: "Dedicated Fajr section. Must keep «الصلاة خير من النوم».",
  },
  {
    id: "abdulbasit",
    file: "adhan_abdulbasit.mp3",
    title: "Abdulbasit Abdusamad — Adhan Messr (03:08, higher bitrate)",
    url: "https://media.assabile.com/assabile/adhan_3435370/d336be9b95d7.mp3",
    fajr: false,
    note: "Classic Egyptian daytime Adhan.",
  },
  {
    id: "abdulbasit",
    file: "adhan_abdulbasit_fajr.mp3",
    title: "Abdulbasit Abdusamad — Adhan Al Fajr, Messr (04:53)",
    url: "https://media.assabile.com/assabile/adhan_3435370/1125f640d83b.mp3",
    fajr: true,
    note: "Dedicated Egyptian Fajr section. Must keep «الصلاة خير من النوم».",
  },
  {
    id: "trablsy",
    file: "adhan_trablsy.mp3",
    title: "Ahmd At-Trablsy — Adhan (04:02, higher bitrate)",
    url: "https://media.assabile.com/assabile/adhan_3435370/ebfa3977664d.mp3",
    fajr: false,
    note: "Higher-bitrate daytime Ahmad Al-Trablsy take on the Assabile Adhan index.",
  },
  {
    id: "trablsy",
    file: "adhan_trablsy_fajr.mp3",
    title: "Ahmd At-Trablsy — Adhan Fajr Al Kuwait (03:49)",
    url: "https://media.assabile.com/assabile/adhan_3435370/31f4182515ea.mp3",
    fajr: true,
    note: "Dedicated Kuwaiti Fajr section. Must keep «الصلاة خير من النوم».",
  },
  {
    id: "mulla",
    file: "adhan_mulla.mp3",
    title: "Ali Ibn Ahmad Mala — Adhan Al Haram Al Makee (04:06)",
    url: "https://media.assabile.com/assabile/adhan_3435370/54944191e2e2.mp3",
    fajr: false,
    note: "Credited Makkah / Maqam al-Muqarrab take.",
  },
  {
    id: "mulla",
    file: "adhan_mulla_fajr.mp3",
    title: "Adhan Al Fajr, Al Haram Al Makkah (muezzin not named on Assabile)",
    url: "https://media.assabile.com/assabile/adhan_3435370/518b4e081437.mp3",
    fajr: true,
    note: "Assabile has no Fajr take credited to Ali Ahmed Mulla. This is the Makkah Fajr archive on the same page. Replace this file with a verified Mulla Fajr if you have one.",
  },
  {
    id: "bokhari",
    file: "adhan_bokhari.mp3",
    title: "Assem Bukhrare — Adhan Al Haram Al Makkah (04:41)",
    url: "https://media.assabile.com/assabile/adhan_3435370/7487fa449eeb.mp3",
    fajr: false,
    note: "Assabile credits Issam/Assem Bokhari on a Makkah recording, not a Madinah one. This is the only track on the index under his name.",
  },
  {
    id: "bokhari",
    file: "adhan_bokhari_fajr.mp3",
    title: "Adhan Al Fajr, Al Haram Al Madinah (muezzin not named on Assabile)",
    url: "https://media.assabile.com/assabile/adhan_3435370/efc564e3b1d2.mp3",
    fajr: true,
    note: "Assabile has no Fajr take credited to Issam Bokhari. This is the Prophet's Mosque Fajr archive. Replace this file with a verified Bokhari Fajr if you have one.",
  },
  {
    id: "ozcan",
    file: "adhan_ozcan.mp3",
    title: "Adhan Turkia (muezzin not named on Assabile, 02:58)",
    url: "https://media.assabile.com/assabile/adhan_3435370/3073e5ff27a5.mp3",
    fajr: false,
    note: "The Assabile Adhan index does not credit Mustafa Özcan. This is the uncredited Turkish Adhan on that page. Replace assets/adhan/adhan_ozcan.mp3 with a verified Özcan recording, then rerun this script.",
  },
  {
    id: "ozcan",
    file: "adhan_ozcan_fajr.mp3",
    title: "Adhan Turkia used as Fajr placeholder (no credited Turkish Fajr on Assabile)",
    url: "https://media.assabile.com/assabile/adhan_3435370/3073e5ff27a5.mp3",
    fajr: true,
    note: "No dedicated Turkish Fajr with «الصلاة خير من النوم» is listed. Replace assets/adhan/adhan_ozcan_fajr.mp3 with a verified Özcan Fajr, then rerun this script.",
  },
]

async function download(track) {
  const dest = path.join(OUT_DIR, track.file)
  const response = await fetch(track.url, {
    headers: { "User-Agent": "UmrahConnectAdhanSetup/1.0" },
    redirect: "follow",
  })
  if (!response.ok) {
    throw new Error(`${track.file} HTTP ${response.status} from ${track.url}`)
  }
  const type = response.headers.get("content-type") || ""
  if (type.includes("text/html")) {
    throw new Error(`${track.file} returned HTML instead of audio`)
  }
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length < 80_000) {
    throw new Error(`${track.file} is only ${bytes.length} bytes`)
  }
  await writeFile(dest, bytes)
  const info = await stat(dest)
  console.log(`saved ${track.file} (${Math.round(info.size / 1024)} KB)`)
  console.log(`  ${track.title}`)
  console.log(`  ${track.note}`)
}

function buildLockClips(mp3Name) {
  const base = mp3Name.replace(/\.mp3$/, "")
  const input = path.join(OUT_DIR, mp3Name)
  const wav = path.join(OUT_DIR, `${base}_lock.wav`)
  const caf = path.join(OUT_DIR, `${base}_lock.caf`)
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      input,
      "-t",
      String(LOCK_SECONDS),
      "-ac",
      "1",
      "-ar",
      "22050",
      "-c:a",
      "pcm_s16le",
      wav,
    ],
    { stdio: "ignore" }
  )
  execFileSync("afconvert", ["-f", "caff", "-d", "LEI16@22050", "-c", "1", wav, caf], {
    stdio: "ignore",
  })
  console.log(`lock  ${base}_lock.wav + .caf (${LOCK_SECONDS}s)`)
}

await mkdir(OUT_DIR, { recursive: true })
for (const track of TRACKS) {
  await download(track)
  buildLockClips(track.file)
}
console.log("Adhan assets ready in assets/adhan")
