import { describe, expect, it } from 'vitest'
import {
  computeWeekRange,
  endOfWeekSaturday,
  formatDateIso,
  nextWeekSunday,
  startOfWeekSunday,
  weekFilename,
  weekLabel,
} from './week.js'

describe('formatDateIso', () => {
  it('formats a date as YYYY-MM-DD', () => {
    // Use local date constructor to avoid UTC offset issues
    const date = new Date(2026, 3, 13) // April 13, 2026 local
    expect(formatDateIso(date)).toBe('2026-04-13')
  })

  it('pads single-digit month and day with leading zeros', () => {
    const date = new Date(2026, 0, 5) // January 5
    expect(formatDateIso(date)).toBe('2026-01-05')
  })
})

describe('startOfWeekSunday', () => {
  it('returns the same date when given a Sunday', () => {
    const sunday = new Date(2026, 3, 12) // April 12, 2026 is a Sunday
    const result = startOfWeekSunday(sunday)
    expect(result.getDay()).toBe(0)
    expect(formatDateIso(result)).toBe('2026-04-12')
  })

  it('rolls back to the previous Sunday for a mid-week day', () => {
    const wednesday = new Date(2026, 3, 15) // April 15 is Wednesday
    const result = startOfWeekSunday(wednesday)
    expect(result.getDay()).toBe(0)
    expect(formatDateIso(result)).toBe('2026-04-12')
  })

  it('rolls back to the previous Sunday for a Saturday', () => {
    const saturday = new Date(2026, 3, 18) // April 18 is Saturday
    const result = startOfWeekSunday(saturday)
    expect(result.getDay()).toBe(0)
    expect(formatDateIso(result)).toBe('2026-04-12')
  })

  it('sets time to midnight', () => {
    const date = new Date(2026, 3, 15, 14, 30, 45)
    const result = startOfWeekSunday(date)
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
    expect(result.getMilliseconds()).toBe(0)
  })
})

describe('endOfWeekSaturday', () => {
  it('returns the Saturday 6 days after the given Sunday', () => {
    const sunday = new Date(2026, 3, 12) // Sunday April 12
    const result = endOfWeekSaturday(sunday)
    expect(result.getDay()).toBe(6) // Saturday
    expect(formatDateIso(result)).toBe('2026-04-18')
  })
})

describe('nextWeekSunday', () => {
  it('returns Sunday exactly 7 days after the given week start', () => {
    const result = nextWeekSunday('2026-04-12')
    expect(result.getDay()).toBe(0) // Sunday
    expect(formatDateIso(result)).toBe('2026-04-19')
  })

  it('handles month boundaries', () => {
    const result = nextWeekSunday('2026-04-26')
    expect(formatDateIso(result)).toBe('2026-05-03')
  })
})

describe('weekFilename', () => {
  it('formats as YYMMDD_Brain_Sheet', () => {
    expect(weekFilename('2026-04-12')).toBe('260412_Brain_Sheet')
  })

  it('pads single-digit month and day', () => {
    expect(weekFilename('2026-01-05')).toBe('260105_Brain_Sheet')
  })

  it('handles year boundaries', () => {
    expect(weekFilename('2030-12-29')).toBe('301229_Brain_Sheet')
  })
})

describe('weekLabel', () => {
  it('includes the month, day, and year', () => {
    const label = weekLabel('2026-04-12')
    expect(label).toContain('2026')
    expect(label).toContain('12')
    // Month name varies by locale; just check it starts with "Week of"
    expect(label).toMatch(/^Week of/)
  })
})

describe('computeWeekRange', () => {
  it('derives weekStart, weekEnd, and filename from a mid-week date', () => {
    const wednesday = new Date(2026, 3, 15) // April 15 (Wed)
    const range = computeWeekRange(wednesday)
    expect(range.weekStart).toBe('2026-04-12')
    expect(range.weekEnd).toBe('2026-04-18')
    expect(range.filename).toBe('260412_Brain_Sheet')
  })

  it('weekStart is always a Sunday', () => {
    const anyDate = new Date(2026, 5, 17) // June 17 (Wed)
    const { weekStart } = computeWeekRange(anyDate)
    const start = new Date(`${weekStart}T00:00:00`)
    expect(start.getDay()).toBe(0)
  })

  it('weekEnd is always 6 days after weekStart', () => {
    const { weekStart, weekEnd } = computeWeekRange(new Date(2026, 3, 15))
    const start = new Date(`${weekStart}T00:00:00`)
    const end = new Date(`${weekEnd}T00:00:00`)
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    expect(diffDays).toBe(6)
  })
})
