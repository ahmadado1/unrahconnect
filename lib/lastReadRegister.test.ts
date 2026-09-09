import { describe, expect, test } from "bun:test"
import {
  emptyLastReadState,
  registerLastRead,
  type LastReadEntry,
} from "./lastReadRegister"

function entry(surahNumber: number): LastReadEntry {
  return {
    surahNumber,
    englishName: `Surah ${surahNumber}`,
    arabicName: "",
    ayah: 1,
    registeredAt: surahNumber,
  }
}

describe("registerLastRead", () => {
  test("pushes the newest entry to the front without deduping", () => {
    let state = emptyLastReadState()
    state = registerLastRead(state, entry(1))
    state = registerLastRead(state, entry(1))
    expect(state.entries.map(e => e.surahNumber)).toEqual([1, 1])
    expect(state.registrationCount).toBe(2)
  })

  test("accumulates up to 5 entries, most recent first", () => {
    let state = emptyLastReadState()
    for (const n of [1, 2, 3, 4, 5]) {
      state = registerLastRead(state, entry(n))
    }
    expect(state.entries.map(e => e.surahNumber)).toEqual([5, 4, 3, 2, 1])
    expect(state.entries.length).toBe(5)
    expect(state.registrationCount).toBe(5)
  })

  test("resets the whole list on the 6th registration instead of FIFO", () => {
    let state = emptyLastReadState()
    for (const n of [1, 2, 3, 4, 5]) {
      state = registerLastRead(state, entry(n))
    }
    state = registerLastRead(state, entry(99))
    expect(state.entries.map(e => e.surahNumber)).toEqual([99])
    expect(state.registrationCount).toBe(1)
  })

  test("rebuilds to 5 after a reset, then resets again", () => {
    let state = emptyLastReadState()
    for (let n = 1; n <= 10; n++) {
      state = registerLastRead(state, entry(n))
    }
    expect(state.entries.map(e => e.surahNumber)).toEqual([10, 9, 8, 7, 6])
    state = registerLastRead(state, entry(11))
    expect(state.entries.map(e => e.surahNumber)).toEqual([11])
  })
})
