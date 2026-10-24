// Offline map: saves the map of the Haram areas of Makkah and Madinah on the phone, by itself,
// the first time there is internet (Premium). After that the offline map works with no internet.
//
// Small on purpose: about 2 km around each Haram, zoom levels 12–16 → roughly 250 map pieces
// ("tiles"), a few MB in all. Closer zoom levels reuse the zoom-16 pieces (the map screen sets
// maximumNativeZ = 16), so no extra download is needed. This also keeps us within the
// OpenStreetMap tile rules (no bulk downloads, nothing at zoom 17+).
//
// Files go exactly where react-native-maps keeps its own tile cache: <cache>/<z>/<x>/<y>,
// so the map finds them as if you had looked at those areas yourself.
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as FileSystem from "expo-file-system/legacy"
import { CITY_CENTER, type OfflineCity } from "./offlinePlaces"

export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
export const TILE_CACHE = `${FileSystem.documentDirectory ?? ""}map-tiles`
/** The map shows zoom 17+ by enlarging zoom-16 pieces. */
export const MAX_NATIVE_ZOOM = 16

const MIN_ZOOM = 12
const RADIUS_KM = 2.2
const DONE_KEY = "offline_map_tiles_v1"
const HEADERS = { "User-Agent": "UmrahConnect/1.1 (+https://myumrahconnect.com; info@myumrahconnect.com)" }

type Tile = { z: number; x: number; y: number }
type Listener = (state: OfflineMapState) => void
export type OfflineMapState = { status: "idle" | "saving" | "saved" | "paused"; done: number; total: number }

let state: OfflineMapState = { status: "idle", done: 0, total: 0 }
let running: Promise<boolean> | null = null
const listeners = new Set<Listener>()

function emit(patch: Partial<OfflineMapState>) {
  state = { ...state, ...patch }
  listeners.forEach(fn => fn(state))
}

export function subscribeOfflineMap(fn: Listener) {
  listeners.add(fn)
  fn(state)
  return () => {
    listeners.delete(fn)
  }
}

// Standard web-map tile maths (same numbering as OpenStreetMap).
const lngToX = (lng: number, z: number) => Math.floor(((lng + 180) / 360) * 2 ** z)
const latToY = (lat: number, z: number) => {
  const r = (lat * Math.PI) / 180
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z)
}

function tilesFor(city: OfflineCity): Tile[] {
  const c = CITY_CENTER[city]
  const dLat = RADIUS_KM / 111
  const dLng = RADIUS_KM / (111 * Math.cos((c.lat * Math.PI) / 180))
  const out: Tile[] = []
  for (let z = MIN_ZOOM; z <= MAX_NATIVE_ZOOM; z++) {
    const x0 = lngToX(c.lng - dLng, z)
    const x1 = lngToX(c.lng + dLng, z)
    const y0 = latToY(c.lat + dLat, z)
    const y1 = latToY(c.lat - dLat, z)
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.push({ z, x, y })
  }
  return out
}

const tilePath = (t: Tile) => `${TILE_CACHE}/${t.z}/${t.x}/${t.y}`

async function hasTile(t: Tile) {
  try {
    const info = await FileSystem.getInfoAsync(tilePath(t))
    return info.exists && (info.size ?? 0) > 100
  } catch {
    return false
  }
}

async function saveTile(t: Tile): Promise<boolean> {
  if (await hasTile(t)) return true
  const final = tilePath(t)
  const temp = `${final}.part`
  try {
    await FileSystem.makeDirectoryAsync(`${TILE_CACHE}/${t.z}/${t.x}`, { intermediates: true }).catch(() => {})
    const url = TILE_URL.replace("{z}", String(t.z)).replace("{x}", String(t.x)).replace("{y}", String(t.y))
    const res = await FileSystem.downloadAsync(url, temp, { headers: HEADERS })
    if (res.status !== 200) throw new Error(`status ${res.status}`)
    await FileSystem.deleteAsync(final, { idempotent: true }).catch(() => {})
    await FileSystem.moveAsync({ from: temp, to: final })
    return true
  } catch {
    await FileSystem.deleteAsync(temp, { idempotent: true }).catch(() => {})
    return false
  }
}

export async function isOfflineMapSaved() {
  return (await AsyncStorage.getItem(DONE_KEY).catch(() => null)) === "done"
}

/**
 * Save both cities' maps if not done yet. Safe to call often (one run at a time, skips saved
 * pieces, stops quietly with no internet and continues next time).
 */
export function ensureOfflineMapTiles(): Promise<boolean> {
  if (running) return running
  running = (async () => {
    if (await isOfflineMapSaved()) {
      emit({ status: "saved" })
      return true
    }
    const tiles = [...tilesFor("makkah"), ...tilesFor("madinah")]
    emit({ status: "saving", done: 0, total: tiles.length })
    let done = 0
    let failed = 0
    // Two at a time, gently.
    for (let i = 0; i < tiles.length; i += 2) {
      const results = await Promise.all(tiles.slice(i, i + 2).map(saveTile))
      done += results.filter(Boolean).length
      failed += results.filter(ok => !ok).length
      emit({ done })
      if (failed >= 6) {
        emit({ status: "paused" })
        return false // no internet: try again next time
      }
    }
    if (failed === 0) {
      await AsyncStorage.setItem(DONE_KEY, "done").catch(() => {})
      emit({ status: "saved" })
      return true
    }
    emit({ status: "paused" })
    return false
  })().finally(() => {
    running = null
  })
  return running
}
