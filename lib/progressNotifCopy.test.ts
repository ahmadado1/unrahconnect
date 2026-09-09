import {
  journeyNotifKind,
  kahfHasStarted,
  kahfNotifKind,
  mulkNotifKind,
  nextWeekdayAt,
} from "./progressNotifCopy"

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`)
  }
}

assertEqual(journeyNotifKind(0, 7), "start", "umrah not started")
assertEqual(journeyNotifKind(1, 7), "continue", "umrah in progress")
assertEqual(journeyNotifKind(3, 7), "continue", "umrah mid")
assertEqual(journeyNotifKind(6, 7), "finish", "umrah last phase")
assertEqual(journeyNotifKind(7, 7), "skip", "umrah done")
assertEqual(journeyNotifKind(0, 9), "start", "hajj not started")
assertEqual(journeyNotifKind(8, 9), "finish", "hajj last phase")
assertEqual(journeyNotifKind(9, 9), "skip", "hajj done")

const empty = { verseNumber: 0, completed: false }
const started = { verseNumber: 12, completed: false }
const done = { verseNumber: 110, completed: true }

assertEqual(kahfHasStarted(empty), false, "kahf empty not started")
assertEqual(kahfHasStarted(started), true, "kahf ayah counts as started")
assertEqual(kahfHasStarted(done), true, "kahf complete is started")

assertEqual(kahfNotifKind("Thu", empty), "start", "thu always start empty")
assertEqual(kahfNotifKind("Thu", started), "start", "thu always start even if reading")
assertEqual(kahfNotifKind("Thu", done), "start", "thu always start even if done")

assertEqual(kahfNotifKind("FriAm", empty), "dontMiss", "fri am not started")
assertEqual(kahfNotifKind("FriAm", started), "continue", "fri am continue")
assertEqual(kahfNotifKind("FriAm", done), "skip", "fri am skip if done")

assertEqual(kahfNotifKind("FriEve", empty), "dontMiss", "fri eve not started")
assertEqual(kahfNotifKind("FriEve", started), "finish", "fri eve finish if started")
assertEqual(kahfNotifKind("FriEve", done), "skip", "fri eve skip if done")

assertEqual(mulkNotifKind({ lastAyah: null, ayahCount: 30, readToday: false }), "start", "mulk unread")
assertEqual(mulkNotifKind({ lastAyah: 8, ayahCount: 30, readToday: true }), "continue", "mulk continue")
assertEqual(mulkNotifKind({ lastAyah: 28, ayahCount: 30, readToday: true }), "finish", "mulk finish")
assertEqual(mulkNotifKind({ lastAyah: 30, ayahCount: 30, readToday: true }), "skip", "mulk skip done today")
assertEqual(mulkNotifKind({ lastAyah: 30, ayahCount: 30, readToday: false }), "start", "mulk yesterday complete is start")

{
  const fridayMorning = new Date(2026, 8, 11, 8, 0, 0) // Fri 8am
  const am = nextWeekdayAt(5, 9, 30, fridayMorning)
  assertEqual(am.getDay(), 5, "next friday stays friday")
  assertEqual(am.getHours(), 9, "friday am hour")
  assertEqual(am.getDate(), 11, "same morning still today")
}

{
  const fridayNoon = new Date(2026, 8, 11, 12, 0, 0)
  const am = nextWeekdayAt(5, 9, 30, fridayNoon)
  assertEqual(am.getDate(), 18, "after 9:30 rolls to next friday")
}

console.log("progressNotifCopy tests passed")
