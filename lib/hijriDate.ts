import { toGregorian, toHijri } from "hijri-converter"
import { HIJRI_MONTHS } from "./islamicEvents"

export type HijriDateParts = {
  day: number
  month: number
  year: number
  monthName: string
}

export type HijriCalendarDay = {
  hijriDay: number
  hijriMonth: number
  hijriYear: number
  hijriMonthName: string
  gregorianDay: number
  gregorianMonth: number
  gregorianYear: number
  weekday: number
}

export function gregorianToHijri(date = new Date()): HijriDateParts {
  const h = toHijri(date.getFullYear(), date.getMonth() + 1, date.getDate())
  return {
    day: h.hd,
    month: h.hm,
    year: h.hy,
    monthName: HIJRI_MONTHS[h.hm - 1] ?? "",
  }
}

export function hijriToGregorian(year: number, month: number, day: number): Date {
  const g = toGregorian(year, month, day)
  return new Date(g.gy, g.gm - 1, g.gd)
}

export function hijriMonthLength(year: number, month: number): 29 | 30 {
  const g = toGregorian(year, month, 30)
  const back = toHijri(g.gy, g.gm, g.gd)
  return back.hy === year && back.hm === month && back.hd === 30 ? 30 : 29
}

export function shiftHijriMonth(year: number, month: number, delta: number) {
  let nextMonth = month + delta
  let nextYear = year
  while (nextMonth > 12) {
    nextMonth -= 12
    nextYear += 1
  }
  while (nextMonth < 1) {
    nextMonth += 12
    nextYear -= 1
  }
  return { year: nextYear, month: nextMonth }
}

export function getHijriMonthGrid(year: number, month: number): {
  days: HijriCalendarDay[]
  firstWeekday: number
  length: number
  monthName: string
} {
  const length = hijriMonthLength(year, month)
  const monthName = HIJRI_MONTHS[month - 1] ?? ""
  const days: HijriCalendarDay[] = []

  for (let day = 1; day <= length; day++) {
    const g = toGregorian(year, month, day)
    const weekday = new Date(g.gy, g.gm - 1, g.gd).getDay()
    days.push({
      hijriDay: day,
      hijriMonth: month,
      hijriYear: year,
      hijriMonthName: monthName,
      gregorianDay: g.gd,
      gregorianMonth: g.gm,
      gregorianYear: g.gy,
      weekday,
    })
  }

  return {
    days,
    firstWeekday: days[0]?.weekday ?? 0,
    length,
    monthName,
  }
}

export const HIJRI_WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

export function hijriMonthKey(month: number) {
  return `hijriMonth${month}` as const
}
