import { describe, expect, it } from 'vitest'
import {
  ageGroupForGrade,
  buildAttendanceSummary,
  buildCanteenForecast,
  buildCanteenSales,
  buildForecast,
  buildForecastHistory,
  classesOf,
  enrichSchool,
  latestAttendance,
  todayISO,
} from './db'

const TODAY = todayISO()

describe('mock database and forecast engine', () => {
  it('exposes school aggregates', () => {
    const school = enrichSchool({
      id: 'school-a',
      name: 'Гимназия №12',
      adminIds: ['u-school-a'],
    })

    expect(school.classesCount).toBe(classesOf('school-a').length)
    expect(school.studentsCount).toBeGreaterThan(0)
    expect(school.admins).toHaveLength(1)
    expect(school.admins[0].fullName).toBe('Наталья Ковалёва')
  })

  it('derives age groups from grades', () => {
    expect(ageGroupForGrade(1)).toBe('junior')
    expect(ageGroupForGrade(4)).toBe('junior')
    expect(ageGroupForGrade(5)).toBe('middle')
    expect(ageGroupForGrade(9)).toBe('middle')
    expect(ageGroupForGrade(10)).toBe('senior')
  })

  it('builds a fixed-plan forecast with a buffer', () => {
    const forecast = buildForecast('school-a', TODAY)

    expect(forecast).not.toBeNull()
    expect(forecast.mealPlan).toBe('fixed')
    expect(forecast.status).toBe('draft')
    expect(forecast.totalPortions).toBe(Math.ceil(forecast.present * 1.1))
    expect(forecast.byAgeGroup).toHaveLength(3)
    expect(forecast.byCategory).toEqual([])
    expect(forecast.totalClasses).toBe(classesOf('school-a').length)
  })

  it('builds a canteen forecast with category economics', () => {
    const forecast = buildCanteenForecast('school-b', TODAY)

    expect(forecast.mealPlan).toBe('canteen')
    expect(forecast.categories).toHaveLength(4)
    expect(forecast.totalForecastQty).toBe(
      forecast.categories.reduce((sum, category) => sum + category.qty, 0),
    )
    expect(forecast.expectedRevenue).toBeGreaterThan(0)
    for (const category of forecast.categories) {
      expect(category.revenue).toBeCloseTo(category.qty * category.avgPrice, 2)
      expect(category.history.length).toBeLessThanOrEqual(14)
    }
  })

  it('returns null for an unknown school', () => {
    expect(buildForecast('missing-school', TODAY)).toBeNull()
    expect(buildAttendanceSummary('missing-school', TODAY)).toBeNull()
    expect(buildCanteenForecast('missing-school', TODAY)).toBeNull()
  })

  it('summarises attendance for all school classes', () => {
    const summary = buildAttendanceSummary('school-a', TODAY)

    expect(summary.totalClasses).toBe(classesOf('school-a').length)
    expect(summary.markedClasses).toBeLessThanOrEqual(summary.totalClasses)
    expect(summary.present).toBe(summary.totalStudents - summary.optOuts - summary.absent)
  })

  it('returns historical forecasts and canteen sales sorted by date', () => {
    const history = buildForecastHistory('school-a', 14)
    const sales = buildCanteenSales('school-b', 14)

    expect(history.length).toBeGreaterThan(0)
    expect(history.length).toBeLessThanOrEqual(14)
    expect([...history].sort((a, b) => a.date.localeCompare(b.date))).toEqual(history)

    expect(sales.length).toBeGreaterThan(0)
    expect(sales.length).toBeLessThanOrEqual(14)
    for (const day of sales) {
      expect(day.totalQty).toBe(day.byCategory.reduce((sum, row) => sum + row.qty, 0))
    }
  })

  it('finds the latest attendance record no later than a date', () => {
    const record = latestAttendance('class-a-2a', TODAY)
    if (record) {
      expect(record.classId).toBe('class-a-2a')
      expect(record.date <= TODAY).toBe(true)
    }
  })
})
