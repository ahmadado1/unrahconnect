// lib/quranAudio.ts
// Quran recitation player.
//   • Verse by verse (Read mode): EveryAyah.com — one mp3 per ayah.
//   • Whole surah (Recitations tab): mp3quran.net — one mp3 per surah.
// Keeps playing when the screen locks, with lock-screen controls.
// Only one thing plays at a time: starting the Quran stops the Adhan, and the other way round.
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
  type AudioStatus,
} from "expo-audio"

// ─── Verse reciters (EveryAyah) ────────────────────────────────────────────
// folder = the folder name on everyayah.com/data/<folder>/SSSAAA.mp3
// free: true = everyone; the rest are Premium (only used if QURAN_AUDIO_FREE is turned off).
/**
 * Quran audio is free for everyone: every reciter, verse by verse and whole surahs, the big player,
 * continue listening and downloads. Set to false to bring back the Premium-only reciters.
 */
export const QURAN_AUDIO_FREE = true

export type VerseReciter = { id: string; name: string; folder: string; free: boolean }

export const VERSE_RECITERS: VerseReciter[] = [
  { id: "alafasy", name: "Mishary Rashid Alafasy", folder: "Alafasy_128kbps", free: true },
  { id: "husary", name: "Mahmoud Khalil Al-Husary", folder: "Husary_128kbps", free: true },
  { id: "abdulbasit", name: "Abdul Basit (Murattal)", folder: "Abdul_Basit_Murattal_192kbps", free: true },
  { id: "sudais", name: "Abdur-Rahman As-Sudais", folder: "Abdurrahmaan_As-Sudais_192kbps", free: QURAN_AUDIO_FREE },
  { id: "shuraym", name: "Saud Ash-Shuraym", folder: "Saood_ash-Shuraym_128kbps", free: QURAN_AUDIO_FREE },
  { id: "maher", name: "Maher Al-Muaiqly", folder: "MaherAlMuaiqly128kbps", free: QURAN_AUDIO_FREE },
  { id: "minshawi", name: "Mohamed Siddiq Al-Minshawi", folder: "Minshawy_Murattal_128kbps", free: QURAN_AUDIO_FREE },
  { id: "ghamadi", name: "Saad Al-Ghamdi", folder: "Ghamadi_40kbps", free: QURAN_AUDIO_FREE },
  { id: "hudhaify", name: "Ali Al-Hudhaify", folder: "Hudhaify_128kbps", free: QURAN_AUDIO_FREE },
  { id: "ayyoub", name: "Muhammad Ayyoub", folder: "Muhammad_Ayyoub_128kbps", free: QURAN_AUDIO_FREE },
  { id: "dossary", name: "Yasser Ad-Dossary", folder: "Yasser_Ad-Dussary_128kbps", free: QURAN_AUDIO_FREE },
  { id: "shatri", name: "Abu Bakr Ash-Shatri", folder: "Abu_Bakr_Ash-Shaatree_128kbps", free: QURAN_AUDIO_FREE },
  { id: "rifai", name: "Hani Ar-Rifai", folder: "Hani_Rifai_192kbps", free: QURAN_AUDIO_FREE },
  { id: "qatami", name: "Nasser Al-Qatami", folder: "Nasser_Alqatami_128kbps", free: QURAN_AUDIO_FREE },
]

const VERSE_RECITER_KEY = "quran_verse_reciter"
export const DEFAULT_VERSE_RECITER_ID = "alafasy"

export function getVerseReciter(id: string | null | undefined) {
  return VERSE_RECITERS.find(r => r.id === id) ?? VERSE_RECITERS[0]
}

export async function loadVerseReciterId() {
  return (await AsyncStorage.getItem(VERSE_RECITER_KEY).catch(() => null)) || DEFAULT_VERSE_RECITER_ID
}

export async function saveVerseReciterId(id: string) {
  await AsyncStorage.setItem(VERSE_RECITER_KEY, id).catch(() => {})
}

const pad3 = (n: number) => String(n).padStart(3, "0")

export function verseAudioUrl(folder: string, surah: number, ayah: number) {
  return `https://everyayah.com/data/${folder}/${pad3(surah)}${pad3(ayah)}.mp3`
}

// ─── Whole-surah reciters (mp3quran.net) ───────────────────────────────────
export type SurahReciter = {
  id: number
  name: string
  /** Base URL: <server><SSS>.mp3 */
  server: string
  /** Surah numbers this recitation has */
  surahs: Set<number>
  moshafName: string
  free: boolean
}

/** Reciters free for everyone in the Recitations tab (matched by name). */
const FREE_SURAH_RECITER_NAMES = ["alafasy", "husary", "abdul basit", "sudais"]

const SURAH_CACHE_KEY = "quran_surah_reciters_v1"
const SURAH_CACHE_MS = 7 * 24 * 60 * 60 * 1000

type CachedSurahReciters = { at: number; list: { id: number; name: string; server: string; surahs: number[]; moshafName: string }[] }

function isFreeSurahReciter(name: string) {
  if (QURAN_AUDIO_FREE) return true
  return FREE_SURAH_RECITER_NAMES.some(n => reciterMatches(name, n))
}

/** All reciters from mp3quran.net (cached for a week). Free ones first. */
export async function fetchSurahReciters(language = "eng"): Promise<SurahReciter[]> {
  const toReciters = (cached: CachedSurahReciters["list"]) =>
    cached
      .map(r => ({ ...r, surahs: new Set(r.surahs), free: isFreeSurahReciter(r.name) }))
      .sort((a, b) => Number(b.free) - Number(a.free) || a.name.localeCompare(b.name))

  try {
    const raw = await AsyncStorage.getItem(SURAH_CACHE_KEY)
    if (raw) {
      const cached = JSON.parse(raw) as CachedSurahReciters
      if (Date.now() - cached.at < SURAH_CACHE_MS && cached.list.length) return toReciters(cached.list)
    }
  } catch {}

  const response = await fetch(`https://mp3quran.net/api/v3/reciters?language=${language}`)
  if (!response.ok) throw new Error("reciters request failed")
  const payload = await response.json()
  const list: CachedSurahReciters["list"] = []
  for (const reciter of payload?.reciters ?? []) {
    // Use the first full "Murattal / Hafs" recitation of each reciter.
    const moshaf = (reciter.moshaf ?? []).find((m: { surah_total?: number }) => Number(m.surah_total) >= 100) ?? reciter.moshaf?.[0]
    if (!moshaf?.server) continue
    list.push({
      id: Number(reciter.id),
      name: String(reciter.name),
      server: String(moshaf.server).endsWith("/") ? String(moshaf.server) : `${moshaf.server}/`,
      surahs: String(moshaf.surah_list ?? "")
        .split(",")
        .map(Number)
        .filter(n => n >= 1 && n <= 114),
      moshafName: String(moshaf.name ?? ""),
    })
  }
  await AsyncStorage.setItem(SURAH_CACHE_KEY, JSON.stringify({ at: Date.now(), list })).catch(() => {})
  return toReciters(list)
}

// ─── Reciter search ────────────────────────────────────────────────────────
// Names are spelled many ways ("Yasser Al-Dosari", "Yaser Ad-Dossary", "Dawsari").
// We turn a name into a simple "search key" so all spellings match each other.
const ARTICLES = new Set(["al", "el", "ad", "ar", "as", "ash", "at", "az", "an", "ibn", "bin"])

function simplifyWord(word: string) {
  let w = word
  if (w.length > 5 && /^(al|el)/.test(w)) w = w.slice(2) // "aldosari" -> "dosari"
  w = w
    .replace(/^abd(u|e|a)?(l|r)?/, "abd") // Abdul / Abdur / Abdel -> abd
    .replace(/m(o|u)hamm?(a|e)d/, "muhamad") // Mohamed / Muhammad
    .replace(/aw|au|ou|oo/g, "o") // Dawsari / Dousari -> Dosari
    .replace(/ai|ae/g, "e") // Sudais / Sudaes
    .replace(/ee|ie/g, "i")
    .replace(/y/g, "i") // Dossary -> Dossari
    .replace(/(.)\1+/g, "$1") // Yasser -> Yaser, Dossari -> Dosari
  return w
}

export function reciterSearchKey(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[\u064B-\u0652]/g, "") // remove Arabic short vowels
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, " ")
    .split(" ")
    .filter(w => w && !ARTICLES.has(w))
    .map(simplifyWord)
}

/** True when every word typed is found in the reciter's name (any spelling). */
export function reciterMatches(name: string, query: string) {
  const words = reciterSearchKey(query)
  if (!words.length) return true
  const nameWords = reciterSearchKey(name)
  const joined = nameWords.join("")
  return words.every(w => joined.includes(w) || nameWords.some(n => n.startsWith(w)))
}

// ─── Favourite reciters (saved on the phone) ───────────────────────────────
const FAV_RECITERS_KEY = "quran_fav_reciters_v1"

export async function loadFavReciters(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(FAV_RECITERS_KEY)
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

export async function saveFavReciters(ids: number[]) {
  await AsyncStorage.setItem(FAV_RECITERS_KEY, JSON.stringify(ids)).catch(() => {})
}

export function surahAudioUrl(reciter: SurahReciter, surah: number) {
  return `${reciter.server}${pad3(surah)}.mp3`
}

// ─── Player state (screens subscribe to this) ──────────────────────────────
export type QuranPlayback = {
  kind: "verse" | "surah" | null
  surah: number | null
  /** Current ayah (verse mode only) */
  ayah: number | null
  playing: boolean
  loading: boolean
  title: string
  reciterName: string
  error: boolean
}

let state: QuranPlayback = { kind: null, surah: null, ayah: null, playing: false, loading: false, title: "", reciterName: "", error: false }
const listeners = new Set<(s: QuranPlayback) => void>()

function setState(patch: Partial<QuranPlayback>) {
  state = { ...state, ...patch }
  for (const listener of listeners) listener(state)
}

export function getQuranPlayback() {
  return state
}

export function subscribeQuranPlayback(listener: (s: QuranPlayback) => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// ─── The player ────────────────────────────────────────────────────────────
let player: AudioPlayer | null = null
let statusSub: { remove: () => void } | null = null
/** Verse mode: what to play next when an ayah ends. */
let verseRun: { reciter: VerseReciter; surah: number; lastAyah: number; continuous: boolean; title: string } | null = null
/** Surah mode: who is reciting (for previous / next surah). */
let surahRun: SurahReciter | null = null
/** Jump here as soon as the file has loaded (used to continue where you stopped). */
let pendingSeek: number | null = null
let lastSavedAt = 0

async function audioOn() {
  try {
    await setIsAudioActiveAsync(true)
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
      shouldRouteThroughEarpiece: false,
    })
  } catch (e) {
    console.log("[Quran audio] audio mode failed:", e)
  }
}

/** Picture shown on the lock screen / Control Center while the Quran plays (the app logo, hosted on the website). */
const LOCK_SCREEN_ARTWORK = "https://myumrahconnect.com/quran-artwork.jpg"

function teardown() {
  try {
    statusSub?.remove()
  } catch {}
  statusSub = null
  if (player) {
    try {
      player.pause()
    } catch {}
    try {
      player.clearLockScreenControls()
    } catch {}
    try {
      player.remove()
    } catch {}
  }
  player = null
}

// ─── Prayer time while the Quran is playing ─────────────────────────────────
// Someone listening in the app (e.g. at the gym with headphones) would not hear the short
// notification sound over the Quran. So while the Quran plays we check the prayer times:
// at prayer time the Quran pauses (spot saved) and the Adhan plays. If a system alarm / native
// player already plays the Adhan (iPhone AlarmKit, Android player), we only pause the Quran.
let lastPrayerCheck = 0
const handledPrayers = new Set<string>()

async function checkPrayerTime() {
  try {
    const { readCachedPrayerTimes, timeToMinutes } = await import("./prayerTimes")
    const { loadOffPrayers, prayerAlertsOn, SYSTEM_ADHAN_KEY, ALERT_PRAYERS } = await import("./prayerToggles")
    if (!(await prayerAlertsOn())) return
    const times = await readCachedPrayerTimes()
    if (!times) return
    const now = new Date()
    const nowMin = now.getHours() * 60 + now.getMinutes()
    const off = await loadOffPrayers()
    for (const name of ALERT_PRAYERS) {
      const at = timeToMinutes((times as unknown as Record<string, string>)[name] ?? "")
      // Within the first 2 minutes of the prayer time, once per prayer per day.
      if (at < 0 || nowMin < at || nowMin > at + 2) continue
      const key = `${now.toDateString()}:${name}`
      if (handledPrayers.has(key) || off.has(name)) return
      handledPrayers.add(key)
      const systemAdhan = (await AsyncStorage.getItem(SYSTEM_ADHAN_KEY)) === "true"
      if (systemAdhan) {
        pauseQuran()
      } else {
        const { playAdhan } = await import("./adhanAudio")
        // playAdhan stops the Quran itself (the Adhan always wins).
        await playAdhan(name as import("./prayerConstants").PrayerName, { forceRestart: true, continueIfPlaying: false })
      }
      return
    }
  } catch (e) {
    console.log("[Quran audio] prayer check failed:", e)
  }
}

function onStatus(status: AudioStatus) {
  // Every ~15 s while playing: is it prayer time? (These updates keep coming with the screen locked.)
  if (status.playing && Date.now() - lastPrayerCheck > 15000) {
    lastPrayerCheck = Date.now()
    void checkPrayerTime()
  }
  if (pendingSeek !== null && status.isLoaded && player) {
    const to = pendingSeek
    pendingSeek = null
    try {
      void player.seekTo(to)
    } catch {}
  }
  // Remember where we are (every few seconds) so Premium users can continue later.
  if (state.kind === "surah" && status.isLoaded && Date.now() - lastSavedAt > 4000) {
    lastSavedAt = Date.now()
    void saveListenSpot(status.currentTime || 0, status.duration || 0)
  }
  if (status.didJustFinish) {
    if (state.kind === "surah") void clearListenSpot()
    // Verse mode: carry on with the next ayah.
    if (state.kind === "verse" && verseRun?.continuous && state.ayah && state.ayah < verseRun.lastAyah) {
      void startVerse(state.ayah + 1)
      return
    }
    teardown()
    // A single verse finished: clear it, so tapping play (on this verse or another) starts fresh.
    if (state.kind === "verse") {
      verseRun = null
      setState({ kind: null, surah: null, ayah: null, playing: false, loading: false, error: false })
      return
    }
    setState({ playing: false, loading: false })
    return
  }
  setState({ playing: status.playing, loading: !status.isLoaded || (status.isBuffering && !status.playing) })
}

async function startUrl(url: string, title: string, artist: string) {
  // Never play over the Adhan.
  const { stopAdhan } = await import("./adhanAudio")
  await stopAdhan().catch(() => {})
  await audioOn()
  // Already have a player (e.g. next ayah, next surah)? Swap the file inside the SAME player.
  // Closing it and making a new one leaves a gap, and a locked iPhone can end the audio in that gap.
  if (player) {
    try {
      player.replace({ uri: url })
      try {
        player.setActiveForLockScreen(true, { title, artist, albumTitle: "UmrahConnect", artworkUrl: LOCK_SCREEN_ARTWORK }, { showSeekForward: false, showSeekBackward: false })
      } catch {}
      player.play()
      return
    } catch (e) {
      console.log("[Quran audio] replace failed, making a new player:", e)
      teardown()
    }
  }
  const next = createAudioPlayer({ uri: url }, { updateInterval: 400, keepAudioSessionActive: true })
  statusSub = next.addListener("playbackStatusUpdate", onStatus)
  player = next
  try {
    next.setActiveForLockScreen(true, { title, artist, albumTitle: "UmrahConnect", artworkUrl: LOCK_SCREEN_ARTWORK }, { showSeekForward: false, showSeekBackward: false })
  } catch {}
  next.play()
}

async function startVerse(ayah: number) {
  if (!verseRun) return
  setState({ kind: "verse", surah: verseRun.surah, ayah, loading: true, playing: false, error: false })
  try {
    await startUrl(
      verseAudioUrl(verseRun.reciter.folder, verseRun.surah, ayah),
      `${verseRun.title} · ${ayah}`,
      verseRun.reciter.name
    )
  } catch (e) {
    console.log("[Quran audio] verse failed:", e)
    setState({ loading: false, playing: false, error: true })
  }
}

/** Play one ayah. continuous = keep going to the end of the surah. */
export async function playVerse(opts: {
  surah: number
  ayah: number
  lastAyah: number
  reciter: VerseReciter
  continuous: boolean
  title: string
}) {
  verseRun = { reciter: opts.reciter, surah: opts.surah, lastAyah: opts.lastAyah, continuous: opts.continuous, title: opts.title }
  setState({ reciterName: opts.reciter.name, title: opts.title })
  await startVerse(opts.ayah)
}

/** Play a whole surah (Recitations tab). */
export async function playSurah(reciter: SurahReciter, surah: number, title: string, startAt = 0) {
  verseRun = null
  surahRun = reciter
  pendingSeek = startAt > 1 ? startAt : null
  lastSavedAt = Date.now()
  setState({ kind: "surah", surah, ayah: null, loading: true, playing: false, title, reciterName: reciter.name, error: false })
  try {
    // Downloaded on the phone? Play the saved file (works with no internet).
    const { downloadedSurahUri } = await import("./quranAudioDownloads")
    const local = await downloadedSurahUri(reciter.id, surah).catch(() => null)
    await startUrl(local ?? surahAudioUrl(reciter, surah), title, reciter.name)
  } catch (e) {
    console.log("[Quran audio] surah failed:", e)
    setState({ loading: false, playing: false, error: true })
  }
}

export function pauseQuran() {
  try {
    player?.pause()
  } catch {}
  setState({ playing: false })
  if (state.kind === "surah" && player) void saveListenSpot(player.currentTime || 0, player.duration || 0)
}

export function resumeQuran() {
  if (!player) return
  try {
    player.play()
  } catch {}
}

export async function stopQuranAudio() {
  if (state.kind === "surah" && player) await saveListenSpot(player.currentTime || 0, player.duration || 0)
  verseRun = null
  teardown()
  setState({ kind: null, surah: null, ayah: null, playing: false, loading: false, error: false })
}

/** Seconds played / total (for the progress bar in the Recitations tab). */
export function getQuranProgress() {
  if (!player) return { position: 0, duration: 0 }
  return { position: player.currentTime || 0, duration: player.duration || 0 }
}

export function seekQuran(seconds: number) {
  try {
    void player?.seekTo(Math.max(0, seconds))
  } catch {}
}


// ─── Previous / next surah (same reciter) ──────────────────────────────────
export function currentSurahReciter() {
  return surahRun
}

/** delta = 1 for next surah, -1 for previous. Skips surahs this reciter doesn't have. */
export async function playNeighbourSurah(delta: 1 | -1, titleFor: (surah: number) => string) {
  if (!surahRun || !state.surah) return
  let next = state.surah + delta
  while (next >= 1 && next <= 114 && !surahRun.surahs.has(next)) next += delta
  if (next < 1 || next > 114) return
  await playSurah(surahRun, next, titleFor(next))
}

// ─── "Continue where you stopped" (Premium) ────────────────────────────────
// Saved on the phone: which reciter, which surah, and the exact second.
const LISTEN_SPOT_KEY = "quran_listen_spot_v1"

export type ListenSpot = {
  reciter: { id: number; name: string; server: string; surahs: number[]; moshafName: string; free: boolean }
  surah: number
  title: string
  position: number
  duration: number
  savedAt: number
}

async function saveListenSpot(position: number, duration: number) {
  if (!surahRun || !state.surah || position < 3) return
  const spot: ListenSpot = {
    reciter: { ...surahRun, surahs: [...surahRun.surahs] },
    surah: state.surah,
    title: state.title,
    position,
    duration,
    savedAt: Date.now(),
  }
  await AsyncStorage.setItem(LISTEN_SPOT_KEY, JSON.stringify(spot)).catch(() => {})
}

async function clearListenSpot() {
  await AsyncStorage.removeItem(LISTEN_SPOT_KEY).catch(() => {})
}

export async function loadListenSpot(): Promise<ListenSpot | null> {
  try {
    const raw = await AsyncStorage.getItem(LISTEN_SPOT_KEY)
    return raw ? (JSON.parse(raw) as ListenSpot) : null
  } catch {
    return null
  }
}

/** Start playing again from the saved second. */
export async function continueListenSpot(spot: ListenSpot) {
  const reciter: SurahReciter = { ...spot.reciter, surahs: new Set(spot.reciter.surahs) }
  await playSurah(reciter, spot.surah, spot.title, spot.position)
}
