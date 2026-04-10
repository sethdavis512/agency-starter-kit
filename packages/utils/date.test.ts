import { describe, it, expect } from 'vitest'
import {
  parseDateTimeLocal,
  formatDateTime,
  formatDateTimeShort,
  formatDate,
  formatDateShort,
  formatDateNumeric,
  formatTime,
} from './date'

// Use a known UTC timestamp for deterministic tests
// 2026-02-11T16:00:00.000Z (UTC) = 2026-02-11T10:00:00 CST (America/Chicago, UTC-6)
const KNOWN_UTC = new Date('2026-02-11T16:00:00.000Z')
const KNOWN_ISO = '2026-02-11T16:00:00.000Z'

describe('parseDateTimeLocal', () => {
  it('parses a datetime-local value as America/Chicago time by default', () => {
    const result = parseDateTimeLocal('2026-02-11T10:00')
    // 10:00 AM CST = 16:00 UTC (CST is UTC-6 in February)
    expect(result.getUTCHours()).toBe(16)
    expect(result.getUTCMinutes()).toBe(0)
    expect(result.getUTCFullYear()).toBe(2026)
    expect(result.getUTCMonth()).toBe(1) // 0-indexed
    expect(result.getUTCDate()).toBe(11)
  })

  it('respects a custom timezone', () => {
    const result = parseDateTimeLocal('2026-02-11T10:00', {
      timeZone: 'America/New_York',
    })
    // 10:00 AM EST = 15:00 UTC (EST is UTC-5 in February)
    expect(result.getUTCHours()).toBe(15)
  })

  it('handles midnight correctly', () => {
    const result = parseDateTimeLocal('2026-02-11T00:00')
    // 00:00 CST = 06:00 UTC
    expect(result.getUTCHours()).toBe(6)
  })
})

describe('formatDateTime', () => {
  it('formats a Date as full date with time in CST', () => {
    const result = formatDateTime(KNOWN_UTC)
    expect(result).toBe('February 11, 2026 at 10:00 AM')
  })

  it('accepts an ISO string', () => {
    const result = formatDateTime(KNOWN_ISO)
    expect(result).toBe('February 11, 2026 at 10:00 AM')
  })

  it('respects a custom timezone', () => {
    const result = formatDateTime(KNOWN_UTC, {
      timeZone: 'America/New_York',
    })
    expect(result).toBe('February 11, 2026 at 11:00 AM')
  })
})

describe('formatDateTimeShort', () => {
  it('formats as short date with time', () => {
    const result = formatDateTimeShort(KNOWN_UTC)
    expect(result).toBe('Feb 11, 2026, 10:00 AM')
  })
})

describe('formatDate', () => {
  it('formats as long date only', () => {
    const result = formatDate(KNOWN_UTC)
    expect(result).toBe('February 11, 2026')
  })
})

describe('formatDateShort', () => {
  it('formats as short date only', () => {
    const result = formatDateShort(KNOWN_UTC)
    expect(result).toBe('Feb 11, 2026')
  })
})

describe('formatDateNumeric', () => {
  it('formats as numeric date', () => {
    const result = formatDateNumeric(KNOWN_UTC)
    expect(result).toBe('2/11/2026')
  })
})

describe('formatTime', () => {
  it('formats as time only', () => {
    const result = formatTime(KNOWN_UTC)
    expect(result).toBe('10:00 AM')
  })

  it('respects a custom timezone', () => {
    const result = formatTime(KNOWN_UTC, { timeZone: 'UTC' })
    expect(result).toBe('4:00 PM')
  })
})
