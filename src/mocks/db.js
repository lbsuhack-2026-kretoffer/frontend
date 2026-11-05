import accessEventsFixture from './fixtures/access-events.json'
import attendanceFixture from './fixtures/attendance.json'
import canteenCategoriesFixture from './fixtures/canteen-categories.json'
import canteenSalesFixture from './fixtures/canteen-sales.json'
import classesFixture from './fixtures/classes.json'
import forecastHistoryFixture from './fixtures/forecast-history.json'
import schoolsFixture from './fixtures/schools.json'
import studentsFixture from './fixtures/students.json'
import usersFixture from './fixtures/users.json'
import { addDaysISO, offsetFromToday, todayISO } from '@/shared/lib/date'

const clone = (value) => structuredClone(value)

let counter = 1000
function newId(prefix) {
  counter += 1
  return `${prefix}-${counter}`
}

const baseDate = todayISO()

export const db = {
  users: clone(usersFixture),
  schools: clone(schoolsFixture),
  classes: clone(classesFixture),
  students: clone(studentsFixture),
  attendance: attendanceFixture.map((record) => ({
    ...record,
    date: addDaysISO(baseDate, record.dayOffset),
  })),
  forecastHistory: forecastHistoryFixture.map((record) => ({
    ...record,
    date: addDaysISO(baseDate, record.dayOffset),
  })),
  canteenCategories: clone(canteenCategoriesFixture),
  canteenSales: canteenSalesFixture.map((record) => ({
    ...record,
    date: addDaysISO(baseDate, record.dayOffset),
  })),
  accessEvents: accessEventsFixture.map((record) => ({
    ...record,
    date: addDaysISO(baseDate, record.dayOffset),
  })),
  approvals: {},
}

export function userById(id) {
  return db.users.find((user) => user.id === id) || null
}

export function schoolById(id) {
  return db.schools.find((school) => school.id === id) || null
}

export function classById(id) {
  return db.classes.find((item) => item.id === id) || null
}

export function classesOf(schoolId) {
  return db.classes.filter((item) => item.schoolId === schoolId)
}

export function studentsOf(classId) {
  return db.students.filter((student) => student.classId === classId)
}

export function studentsOfSchool(schoolId) {
  return db.students.filter((student) => student.schoolId === schoolId)
}

export function teachersOf(schoolId) {
  return db.users.filter((user) => user.role === 'teacher' && user.schoolId === schoolId)
}

export function attendanceFor(classId, date) {
  return db.attendance.find((record) => record.classId === classId && record.date === date) || null
}

export function latestAttendance(classId, date) {
  return (
    db.attendance
      .filter((record) => record.classId === classId && record.date <= date)
      .sort((a, b) => b.date.localeCompare(a.date))[0] || null
  )
}

export function enrichSchool(school) {
  if (!school) return null
  const schoolClasses = classesOf(school.id)
  return {
    ...school,
    classesCount: schoolClasses.length,
    studentsCount: studentsOfSchool(school.id).length,
    teachersCount: teachersOf(school.id).length,
    admins: (school.adminIds || []).map(userById).filter(Boolean),
  }
}

export function enrichClass(cls, date) {
  if (!cls) return null
  const students = studentsOf(cls.id)
  const teacherNames = (cls.teacherIds || []).map((id) => userById(id)?.fullName).filter(Boolean)
  const record = date ? attendanceFor(cls.id, date) : null
  return {
    ...cls,
    teacherNames,
    studentsCount: students.length,
    optOutsCount: students.filter((student) => student.mealStatus === 'optOut').length,
    ...(date
      ? {
          attendance: record
            ? {
                status: 'marked',
                absentCount: record.absentStudentIds.length,
                submittedAt: record.submittedAt,
                submittedByName: userById(record.submittedBy)?.fullName || null,
              }
            : { status: 'unmarked', absentCount: 0, submittedAt: null, submittedByName: null },
        }
      : {}),
  }
}

function classForecastStats(cls, date) {
  const students = studentsOf(cls.id)
  const optOuts = students.filter((student) => student.mealStatus === 'optOut').length
  const exact = attendanceFor(cls.id, date)
  const fallback = exact ? null : latestAttendance(cls.id, date)
  const record = exact || fallback
  const absent = record ? record.absentStudentIds.length : 0
  const present = Math.max(0, students.length - optOuts - absent)
  return {
    students: students.length,
    optOuts,
    absent,
    present,
    exact,
    record,
    basedOnDate: record?.date || null,
  }
}

function averageConfidence(schoolId) {
  const rows = db.forecastHistory.filter((row) => row.schoolId === schoolId)
  if (!rows.length) return 0.8
  return Math.round((rows.reduce((sum, row) => sum + row.accuracy, 0) / rows.length) * 100) / 100
}

export function buildForecast(schoolId, date) {
  const school = schoolById(schoolId)
  if (!school) return null
  const schoolClasses = classesOf(schoolId)
  const bufferPercent = school.bufferPercent

  const byAgeGroupMap = new Map()
  let totalStudents = 0
  let optOuts = 0
  let absent = 0
  let present = 0
  let markedClasses = 0
  let basedOnDate = date

  for (const cls of schoolClasses) {
    const stats = classForecastStats(cls, date)
    totalStudents += stats.students
    optOuts += stats.optOuts
    absent += stats.absent
    present += stats.present
    if (stats.exact) markedClasses += 1
    if (!stats.exact && stats.basedOnDate && stats.basedOnDate < basedOnDate) {
      basedOnDate = stats.basedOnDate
    }
    const group = byAgeGroupMap.get(cls.ageGroup) || {
      ageGroup: cls.ageGroup,
      students: 0,
      optOuts: 0,
      absent: 0,
      present: 0,
    }
    group.students += stats.students
    group.optOuts += stats.optOuts
    group.absent += stats.absent
    group.present += stats.present
    byAgeGroupMap.set(cls.ageGroup, group)
  }

  const byAgeGroup = ['junior', 'middle', 'senior']
    .map((ageGroup) => byAgeGroupMap.get(ageGroup))
    .filter(Boolean)
    .map((group) => ({
      ...group,
      portions: Math.ceil(group.present * (1 + bufferPercent / 100)),
    }))

  const approval = db.approvals[`${schoolId}:${date}`]

  const byCategory =
    school.mealPlan === 'canteen'
      ? db.canteenCategories
          .filter((category) => category.schoolId === schoolId)
          .map((category) => {
            const qty = Math.ceil(present * 0.88 * category.share * (1 + bufferPercent / 100))
            return {
              id: category.id,
              name: category.name,
              unit: category.unit,
              share: category.share,
              avgPrice: category.avgPrice,
              qty,
              revenue: Math.round(qty * category.avgPrice * 100) / 100,
            }
          })
      : []

  return {
    schoolId,
    schoolName: school.name,
    date,
    mealPlan: school.mealPlan,
    bufferPercent,
    totalStudents,
    optOuts,
    absent,
    present,
    totalPortions: Math.ceil(present * (1 + bufferPercent / 100)),
    byAgeGroup,
    byCategory,
    markedClasses,
    totalClasses: schoolClasses.length,
    basedOnDate,
    confidence: averageConfidence(schoolId),
    status: approval?.status || 'draft',
    approvedAt: approval?.approvedAt || null,
    approvedBy: approval?.approvedBy || null,
    comment: approval?.comment || '',
  }
}

export function buildAttendanceSummary(schoolId, date) {
  const school = schoolById(schoolId)
  if (!school) return null
  const schoolClasses = classesOf(schoolId)
  let totalStudents = 0
  let optOuts = 0
  let absent = 0
  let markedClasses = 0

  const classes = schoolClasses.map((cls) => {
    const students = studentsOf(cls.id)
    const classOptOuts = students.filter((student) => student.mealStatus === 'optOut').length
    const record = attendanceFor(cls.id, date)
    const classAbsent = record ? record.absentStudentIds.length : 0
    totalStudents += students.length
    optOuts += classOptOuts
    absent += classAbsent
    if (record) markedClasses += 1
    return {
      id: cls.id,
      name: cls.name,
      ageGroup: cls.ageGroup,
      students: students.length,
      optOuts: classOptOuts,
      absent: classAbsent,
      present: students.length - classOptOuts - classAbsent,
      status: record ? 'marked' : 'unmarked',
      submittedAt: record?.submittedAt || null,
      submittedByName: record ? userById(record.submittedBy)?.fullName || null : null,
      teacherNames: (cls.teacherIds || []).map((id) => userById(id)?.fullName).filter(Boolean),
    }
  })

  return {
    schoolId,
    date,
    totalStudents,
    optOuts,
    absent,
    present: totalStudents - optOuts - absent,
    markedClasses,
    totalClasses: schoolClasses.length,
    classes,
  }
}

export function buildForecastHistory(schoolId, days = 14) {
  return db.forecastHistory
    .filter((row) => row.schoolId === schoolId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-days)
    .map((row) => ({
      date: row.date,
      forecast: row.forecast,
      actual: row.actual,
      wastePortions: row.wastePortions,
      wasteCost: row.wasteCost,
      accuracy: row.accuracy,
      confidence: row.confidence,
      bufferPercent: row.bufferPercent,
    }))
}

export function buildCanteenSales(schoolId, days = 14) {
  const byDate = new Map()
  for (const row of db.canteenSales.filter((item) => item.schoolId === schoolId)) {
    if (!byDate.has(row.date)) byDate.set(row.date, [])
    byDate.get(row.date).push(row)
  }
  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-days)
    .map(([date, rows]) => ({
      date,
      totalQty: rows.reduce((sum, row) => sum + row.qty, 0),
      revenue: Math.round(rows.reduce((sum, row) => sum + row.revenue, 0) * 100) / 100,
      wasteQty: rows.reduce((sum, row) => sum + row.wasteQty, 0),
      byCategory: rows.map((row) => {
        const category = db.canteenCategories.find((item) => item.id === row.categoryId)
        return {
          id: row.categoryId,
          name: category?.name || row.categoryId,
          qty: row.qty,
          revenue: row.revenue,
          wasteQty: row.wasteQty,
        }
      }),
    }))
}

export function buildCanteenForecast(schoolId, date) {
  const forecast = buildForecast(schoolId, date)
  if (!forecast) return null
  const sales = buildCanteenSales(schoolId, 30)
  const yesterday = addDaysISO(date, -1)
  const yesterdaySales = sales.find((row) => row.date === yesterday)

  const categories = db.canteenCategories
    .filter((category) => category.schoolId === schoolId)
    .map((category) => {
      const history = sales.map((row) => ({
        date: row.date,
        qty: row.byCategory.find((item) => item.id === category.id)?.qty || 0,
        wasteQty: row.byCategory.find((item) => item.id === category.id)?.wasteQty || 0,
      }))
      const yesterdayRow = history.find((row) => row.date === yesterday)
      const baseQty = Math.ceil(
        forecast.present * 0.88 * category.share * (1 + forecast.bufferPercent / 100),
      )
      return {
        ...category,
        qty: baseQty,
        revenue: Math.round(baseQty * category.avgPrice * 100) / 100,
        yesterdayQty: yesterdayRow?.qty || 0,
        wasteQty: yesterdayRow?.wasteQty || 0,
        history: history.slice(-14),
      }
    })

  return {
    ...forecast,
    categories,
    yesterdayDate: yesterday,
    yesterdayTotalQty: yesterdaySales?.totalQty || 0,
    totalForecastQty: categories.reduce((sum, category) => sum + category.qty, 0),
    expectedRevenue: Math.round(categories.reduce((sum, category) => sum + category.revenue, 0) * 100) / 100,
  }
}

export function enrichAccessEvent(event) {
  const student = db.students.find((item) => item.id === event.studentId)
  const cls = student ? classById(student.classId) : null
  return {
    ...event,
    studentName: student?.fullName || 'Неизвестный ученик',
    className: cls?.name || '—',
  }
}

export function createId(prefix) {
  return newId(prefix)
}

export function ageGroupForGrade(grade) {
  if (grade <= 4) return 'junior'
  if (grade <= 9) return 'middle'
  return 'senior'
}

export { offsetFromToday, todayISO }
