import { describe, expect, it } from 'vitest'
import {
  addDaysISO,
  formatDate,
  formatDateRange,
  offsetFromToday,
  relativeDayLabel,
  lastNDates,
  todayISO,
  tomorrowISO,
} from './date'

describe('date helpers', () => {
  it('adds and subtracts days in ISO format', () => {
    expect(addDaysISO('2026-11-05', 1)).toBe('2026-11-06')
    expect(addDaysISO('2026-11-05', -5)).toBe('2026-10-31')
    expect(addDaysISO('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('returns today and tomorrow as ISO dates', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(tomorrowISO()).toBe(addDaysISO(todayISO(), 1))
  })

  it('formats dates in Russian locale', () => {
    expect(formatDate('2026-11-05', 'd MMMM yyyy')).toBe('5 ноября 2026')
    expect(formatDate('2026-01-02', 'd MMM')).toBe('2 янв.')
    expect(formatDate(null)).toBe('—')
  })

  it('builds a date range label', () => {
    expect(formatDateRange('2026-11-01', '2026-11-14')).toBe('1 нояб. — 14 нояб. 2026')
  })

  it('calculates the offset from today', () => {
    expect(offsetFromToday(todayISO())).toBe(0)
    expect(offsetFromToday(addDaysISO(todayISO(), -2))).toBe(-2)
    expect(offsetFromToday(null)).toBeNull()
  })

  it('labels relative days', () => {
    expect(relativeDayLabel(todayISO())).toBe('сегодня')
    expect(relativeDayLabel(tomorrowISO())).toBe('завтра')
    expect(relativeDayLabel(addDaysISO(todayISO(), -1))).toBe('вчера')
    expect(relativeDayLabel('2020-11-05')).toBe(formatDate('2020-11-05', 'd MMMM'))
  })

  it('returns the last N dates including the end date', () => {
    expect(lastNDates(3, '2026-11-05')).toEqual(['2026-11-03', '2026-11-04', '2026-11-05'])
  })
})
