/**
 * Rebuilds the 25-second notification clips from the Adhan MP3s already
 * in assets/adhan. It does not download or replace those recordings.
 *
 * Voices, each with its own Fajr file:
 * Sheikh Abdul Basit Abdus Samad, Sheikh Ahmad Al-Trablsy,
 * Sheikh Mishary Rashid Alafasy.
 *
 * The notification tone is a 25s .wav (Apple's limit is 30s) on iPhone and Android.
 * The full MP3 continues in the app only if the notification is tapped.
 *
 * Usage: node scripts/fetch-adhan-assets.mjs
 */
import { execFileSync } from "node:child_process"
import { stat } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const OUT_DIR = path.join(ROOT, "assets", "adhan")
const LOCK_SECONDS = 25

const FILES = [
  "adhan_abdulbasit.mp3",
  "adhan_abdulbasit_fajr.mp3",
  "adhan_trablsy.mp3",
  "adhan_trablsy_fajr.mp3",
  "adhan_alafasy.mp3",
  "adhan_alafasy_fajr.mp3",
]

function buildLockClip(mp3Name) {
  const base = mp3Name.replace(/\.mp3$/, "")
  const input = path.join(OUT_DIR, mp3Name)
  const wav = path.join(OUT_DIR, `${base}_lock.wav`)
  execFileSync(
    "ffmpeg",
    ["-y", "-i", input, "-t", String(LOCK_SECONDS), "-ac", "1", "-ar", "22050", "-c:a", "pcm_s16le", wav],
    { stdio: "ignore" }
  )
  console.log(`lock  ${base}_lock.wav (${LOCK_SECONDS}s)`)
}

for (const file of FILES) {
  const info = await stat(path.join(OUT_DIR, file))
  if (info.size < 80_000) {
    throw new Error(`${file} is only ${info.size} bytes`)
  }
  buildLockClip(file)
}

console.log("Adhan lock clips ready in assets/adhan")
