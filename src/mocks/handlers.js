import { HttpResponse, delay, http } from 'msw'
import { addDaysISO } from '@/shared/lib/date'
import {
  ageGroupForGrade,
  attendanceFor,
  buildAttendanceSummary,
  buildCanteenForecast,
  buildCanteenSales,
  buildForecast,
  buildForecastHistory,
  classById,
  classesOf,
  createId,
  db,
  enrichAccessEvent,
  enrichClass,
  enrichSchool,
  latestAttendance,
  schoolById,
  studentsOf,
  studentsOfSchool,
  teachersOf,
  todayISO,
  userById,
} from './db'

const API = '*/api/v1'

const pause = () => delay(120 + Math.round(Math.random() * 230))
const notFound = (detail = 'Не найдено') => HttpResponse.json({ detail }, { status: 404 })
const badRequest = (detail) => HttpResponse.json({ detail }, { status: 400 })

function currentUser(request) {
  const id = request.headers.get('X-Demo-User')
  return db.users.find((user) => user.id === id) || null
}

function withSchoolName(user) {
  if (!user) return null
  const school = user.schoolId ? schoolById(user.schoolId) : null
  return { ...user, schoolName: school?.name || null }
}

function attendancePayload(classId, date) {
  const cls = classById(classId)
  if (!cls) return null
  const school = schoolById(cls.schoolId)
  const students = studentsOf(classId)
  const record = attendanceFor(classId, date)
  const absentIds = record?.absentStudentIds || []

  return {
    classId,
    className: cls.name,
    schoolId: cls.schoolId,
    schoolName: school?.name || '',
    date,
    deadline: school?.attendanceDeadline || '09:30',
    status: record ? 'marked' : 'unmarked',
    absentStudentIds: absentIds,
    submittedAt: record?.submittedAt || null,
    submittedByName: record ? userById(record.submittedBy)?.fullName || null : null,
    totalStudents: students.length,
    optOuts: students.filter((student) => student.mealStatus === 'optOut').length,
    students: [...students]
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'))
      .map((student) => ({
        id: student.id,
        fullName: student.fullName,
        mealStatus: student.mealStatus,
        cardNumber: student.cardNumber,
        absent: absentIds.includes(student.id),
      })),
  }
}

function teacherWithClasses(user) {
  return {
    ...withSchoolName(user),
    classes: db.classes
      .filter((item) => (item.teacherIds || []).includes(user.id))
      .map((item) => ({ id: item.id, name: item.name })),
  }
}

export const handlers = [
  http.get(`${API}/auth/demo-users`, async () => {
    await pause()
    const order = { platform_admin: 0, school_admin: 1, teacher: 2, canteen: 3, guard: 4 }
    const users = [...db.users]
      .sort((a, b) => (order[a.role] ?? 9) - (order[b.role] ?? 9))
      .map((user) =>
        user.role === 'teacher'
          ? teacherWithClasses(user)
          : { ...withSchoolName(user), classes: [] },
      )
    return HttpResponse.json(users)
  }),

  http.post(`${API}/auth/login`, async ({ request }) => {
    await pause()
    const body = await request.json()
    const user = db.users.find((item) => item.id === body.userId)
    if (!user) return notFound('Демо-пользователь не найден')
    return HttpResponse.json(withSchoolName(user))
  }),

  http.get(`${API}/auth/me`, async ({ request }) => {
    await pause()
    const user = currentUser(request)
    if (!user) return HttpResponse.json({ detail: 'Не авторизован' }, { status: 401 })
    return HttpResponse.json(withSchoolName(user))
  }),

  http.get(`${API}/platform/stats`, async () => {
    await pause()
    const date = todayISO()
    let present = 0
    let absent = 0
    let optOuts = 0
    let markedClasses = 0
    let totalClasses = 0
    for (const school of db.schools) {
      const summary = buildAttendanceSummary(school.id, date)
      present += summary.present
      absent += summary.absent
      optOuts += summary.optOuts
      markedClasses += summary.markedClasses
      totalClasses += summary.totalClasses
    }
    return HttpResponse.json({
      schools: db.schools.length,
      activeSchools: db.schools.filter((school) => school.accessEnabled).length,
      students: db.students.length,
      classes: db.classes.length,
      teachers: db.users.filter((user) => user.role === 'teacher').length,
      attendance: { present, absent, optOuts, markedClasses, totalClasses, date },
    })
  }),

  http.get(`${API}/platform/schools`, async ({ request }) => {
    await pause()
    const url = new URL(request.url)
    const query = (url.searchParams.get('query') || '').toLowerCase()
    const page = Number(url.searchParams.get('page') || 1)
    const pageSize = Number(url.searchParams.get('pageSize') || 20)
    const items = db.schools
      .map(enrichSchool)
      .filter((school) => {
        if (!query) return true
        return (
          school.name.toLowerCase().includes(query) ||
          school.city.toLowerCase().includes(query) ||
          school.address.toLowerCase().includes(query)
        )
      })
    return HttpResponse.json({
      items: items.slice((page - 1) * pageSize, page * pageSize),
      total: items.length,
      page,
      pageSize,
    })
  }),

  http.post(`${API}/platform/schools`, async ({ request }) => {
    await pause()
    const body = await request.json()
    if (!body.name || !body.city) return badRequest('Укажите название и город школы')
    const id = createId('school')
    const school = {
      id,
      name: body.name,
      city: body.city,
      address: body.address || '',
      phone: body.phone || '',
      email: body.email || '',
      mealPlan: body.mealPlan || 'fixed',
      timezone: body.timezone || 'Europe/Minsk',
      bufferPercent: Number(body.bufferPercent ?? 10),
      attendanceDeadline: body.attendanceDeadline || '09:30',
      accessEnabled: true,
      createdAt: todayISO(),
      integrations: { pos: false, skud: false },
      adminIds: [],
    }
    db.schools.push(school)

    if (body.adminEmail) {
      let admin = db.users.find((user) => user.email === body.adminEmail)
      if (admin) {
        admin.role = 'school_admin'
        admin.schoolId = id
      } else {
        admin = {
          id: createId('u'),
          fullName: body.adminFullName || 'Администратор школы',
          email: body.adminEmail,
          role: 'school_admin',
          schoolId: id,
          position: 'Завуч',
          avatarUrl: null,
        }
        db.users.push(admin)
      }
      school.adminIds.push(admin.id)
    }

    return HttpResponse.json(enrichSchool(school), { status: 201 })
  }),

  http.get(`${API}/platform/schools/:id`, async ({ params }) => {
    await pause()
    const school = schoolById(params.id)
    if (!school) return notFound('Школа не найдена')
    return HttpResponse.json(enrichSchool(school))
  }),

  http.patch(`${API}/platform/schools/:id`, async ({ params, request }) => {
    await pause()
    const school = schoolById(params.id)
    if (!school) return notFound('Школа не найдена')
    const body = await request.json()
    Object.assign(school, body)
    return HttpResponse.json(enrichSchool(school))
  }),

  http.post(`${API}/platform/schools/:id/admins`, async ({ params, request }) => {
    await pause()
    const school = schoolById(params.id)
    if (!school) return notFound('Школа не найдена')
    const body = await request.json()
    if (!body.email) return badRequest('Укажите e-mail администратора')
    let admin = db.users.find((user) => user.email === body.email)
    if (admin) {
      admin.role = 'school_admin'
      admin.schoolId = school.id
      if (body.fullName) admin.fullName = body.fullName
    } else {
      admin = {
        id: createId('u'),
        fullName: body.fullName || 'Администратор школы',
        email: body.email,
        role: 'school_admin',
        schoolId: school.id,
        position: 'Завуч',
        avatarUrl: null,
      }
      db.users.push(admin)
    }
    school.adminIds = [...new Set([...(school.adminIds || []), admin.id])]
    return HttpResponse.json(enrichSchool(school))
  }),

  http.delete(`${API}/platform/schools/:id/admins/:userId`, async ({ params }) => {
    await pause()
    const school = schoolById(params.id)
    if (!school) return notFound('Школа не найдена')
    school.adminIds = (school.adminIds || []).filter((id) => id !== params.userId)
    const admin = userById(params.userId)
    if (admin && admin.role === 'school_admin') {
      db.users = db.users.filter((user) => user.id !== admin.id)
    }
    return HttpResponse.json(enrichSchool(school))
  }),

  http.post(`${API}/platform/schools/:id/access`, async ({ params, request }) => {
    await pause()
    const school = schoolById(params.id)
    if (!school) return notFound('Школа не найдена')
    const body = await request.json()
    school.accessEnabled = Boolean(body.enabled)
    return HttpResponse.json(enrichSchool(school))
  }),

  http.get(`${API}/schools/:id`, async ({ params }) => {
    await pause()
    const school = schoolById(params.id)
    if (!school) return notFound('Школа не найдена')
    return HttpResponse.json(enrichSchool(school))
  }),

  http.patch(`${API}/schools/:id`, async ({ params, request }) => {
    await pause()
    const school = schoolById(params.id)
    if (!school) return notFound('Школа не найдена')
    const body = await request.json()
    if (body.integrations) {
      school.integrations = { ...school.integrations, ...body.integrations }
      delete body.integrations
    }
    Object.assign(school, body)
    return HttpResponse.json(enrichSchool(school))
  }),

  http.get(`${API}/schools/:id/classes`, async ({ params, request }) => {
    await pause()
    const school = schoolById(params.id)
    if (!school) return notFound('Школа не найдена')
    const date = new URL(request.url).searchParams.get('date')
    const items = classesOf(params.id)
      .map((cls) => enrichClass(cls, date))
      .sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name, 'ru'))
    return HttpResponse.json(items)
  }),

  http.post(`${API}/schools/:id/classes`, async ({ params, request }) => {
    await pause()
    const school = schoolById(params.id)
    if (!school) return notFound('Школа не найдена')
    const body = await request.json()
    if (!body.name) return badRequest('Укажите название класса')
    const grade = Number(body.grade || 1)
    const cls = {
      id: createId('class'),
      schoolId: params.id,
      name: body.name,
      grade,
      ageGroup: body.ageGroup || ageGroupForGrade(grade),
      teacherIds: body.teacherId ? [body.teacherId] : [],
      studentsCount: 0,
    }
    db.classes.push(cls)
    return HttpResponse.json(enrichClass(cls, todayISO()), { status: 201 })
  }),

  http.get(`${API}/classes/:id`, async ({ params, request }) => {
    await pause()
    const cls = classById(params.id)
    if (!cls) return notFound('Класс не найден')
    const date = new URL(request.url).searchParams.get('date') || todayISO()
    return HttpResponse.json(enrichClass(cls, date))
  }),

  http.patch(`${API}/classes/:id`, async ({ params, request }) => {
    await pause()
    const cls = classById(params.id)
    if (!cls) return notFound('Класс не найден')
    const body = await request.json()
    if (body.teacherId !== undefined) {
      cls.teacherIds = body.teacherId ? [body.teacherId] : []
      delete body.teacherId
    }
    if (body.teacherIds !== undefined) {
      cls.teacherIds = body.teacherIds
      delete body.teacherIds
    }
    Object.assign(cls, body)
    return HttpResponse.json(enrichClass(cls, todayISO()))
  }),

  http.delete(`${API}/classes/:id`, async ({ params }) => {
    await pause()
    const cls = classById(params.id)
    if (!cls) return notFound('Класс не найден')
    const studentIds = studentsOf(cls.id).map((student) => student.id)
    db.classes = db.classes.filter((item) => item.id !== cls.id)
    db.students = db.students.filter((student) => student.classId !== cls.id)
    db.attendance = db.attendance
      .filter((record) => record.classId !== cls.id)
      .map((record) => ({
        ...record,
        absentStudentIds: record.absentStudentIds.filter((id) => !studentIds.includes(id)),
      }))
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${API}/classes/:id/students`, async ({ params }) => {
    await pause()
    const cls = classById(params.id)
    if (!cls) return notFound('Класс не найден')
    return HttpResponse.json(
      [...studentsOf(params.id)].sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru')),
    )
  }),

  http.post(`${API}/classes/:id/students`, async ({ params, request }) => {
    await pause()
    const cls = classById(params.id)
    if (!cls) return notFound('Класс не найден')
    const body = await request.json()
    if (!body.fullName) return badRequest('Укажите имя ученика')
    const student = {
      id: createId('s'),
      schoolId: cls.schoolId,
      classId: cls.id,
      fullName: body.fullName,
      mealStatus: body.mealStatus || 'regular',
      ageGroup: cls.ageGroup,
      cardNumber: `C-${String(db.students.length + 1).padStart(4, '0')}`,
    }
    db.students.push(student)
    return HttpResponse.json(student, { status: 201 })
  }),

  http.patch(`${API}/students/:id`, async ({ params, request }) => {
    await pause()
    const student = db.students.find((item) => item.id === params.id)
    if (!student) return notFound('Ученик не найден')
    const body = await request.json()
    Object.assign(student, body)
    return HttpResponse.json(student)
  }),

  http.delete(`${API}/students/:id`, async ({ params }) => {
    await pause()
    const student = db.students.find((item) => item.id === params.id)
    if (!student) return notFound('Ученик не найден')
    db.students = db.students.filter((item) => item.id !== student.id)
    db.attendance = db.attendance.map((record) => ({
      ...record,
      absentStudentIds: record.absentStudentIds.filter((id) => id !== student.id),
    }))
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${API}/schools/:id/students`, async ({ params, request }) => {
    await pause()
    const school = schoolById(params.id)
    if (!school) return notFound('Школа не найдена')
    const query = (new URL(request.url).searchParams.get('query') || '').toLowerCase()
    const items = studentsOfSchool(params.id)
      .map((student) => ({
        ...student,
        className: classById(student.classId)?.name || '—',
      }))
      .filter((student) => !query || student.fullName.toLowerCase().includes(query))
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'))
    return HttpResponse.json(items)
  }),

  http.get(`${API}/schools/:id/teachers`, async ({ params }) => {
    await pause()
    const school = schoolById(params.id)
    if (!school) return notFound('Школа не найдена')
    const items = teachersOf(params.id).map((user) => ({
      ...withSchoolName(user),
      classes: db.classes
        .filter((cls) => (cls.teacherIds || []).includes(user.id))
        .map((cls) => ({ id: cls.id, name: cls.name })),
    }))
    return HttpResponse.json(items)
  }),

  http.post(`${API}/schools/:id/teachers`, async ({ params, request }) => {
    await pause()
    const school = schoolById(params.id)
    if (!school) return notFound('Школа не найдена')
    const body = await request.json()
    if (!body.fullName || !body.email) return badRequest('Укажите имя и e-mail учителя')
    const teacher = {
      id: createId('u'),
      fullName: body.fullName,
      email: body.email,
      role: 'teacher',
      schoolId: params.id,
      position: body.position || 'Учитель',
      avatarUrl: null,
    }
    db.users.push(teacher)
    return HttpResponse.json({ ...withSchoolName(teacher), classes: [] }, { status: 201 })
  }),

  http.post(`${API}/classes/:id/teacher`, async ({ params, request }) => {
    await pause()
    const cls = classById(params.id)
    if (!cls) return notFound('Класс не найден')
    const body = await request.json()
    cls.teacherIds = body.teacherId ? [body.teacherId] : []
    return HttpResponse.json(enrichClass(cls, todayISO()))
  }),

  http.get(`${API}/classes/:id/attendance`, async ({ params, request }) => {
    await pause()
    const date = new URL(request.url).searchParams.get('date') || todayISO()
    const payload = attendancePayload(params.id, date)
    if (!payload) return notFound('Класс не найден')
    return HttpResponse.json(payload)
  }),

  http.put(`${API}/classes/:id/attendance`, async ({ params, request }) => {
    await pause()
    const cls = classById(params.id)
    if (!cls) return notFound('Класс не найден')
    const body = await request.json()
    const date = body.date || todayISO()
    const classStudentIds = new Set(studentsOf(cls.id).map((student) => student.id))
    const absent = (body.absentStudentIds || []).filter((id) => classStudentIds.has(id))
    const user = currentUser(request)
    const now = new Date()
    const submittedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const existing = attendanceFor(cls.id, date)
    if (existing) {
      existing.absentStudentIds = absent
      existing.submittedBy = user?.id || cls.teacherIds?.[0] || null
      existing.submittedTime = submittedTime
    } else {
      db.attendance.push({
        id: createId('att'),
        classId: cls.id,
        schoolId: cls.schoolId,
        date,
        absentStudentIds: absent,
        submittedBy: user?.id || cls.teacherIds?.[0] || null,
        submittedTime,
        dayOffset: null,
      })
    }

    return HttpResponse.json(attendancePayload(cls.id, date))
  }),

  http.get(`${API}/teachers/me/classes`, async ({ request }) => {
    await pause()
    const user = currentUser(request)
    if (!user) return HttpResponse.json({ detail: 'Не авторизован' }, { status: 401 })
    if (user.role !== 'teacher') {
      return HttpResponse.json({ detail: 'Доступно только учителям' }, { status: 403 })
    }
    const date = new URL(request.url).searchParams.get('date') || todayISO()
    const school = schoolById(user.schoolId)
    const classes = db.classes
      .filter((cls) => (cls.teacherIds || []).includes(user.id))
      .map((cls) => {
        const students = studentsOf(cls.id)
        const optOuts = students.filter((student) => student.mealStatus === 'optOut').length
        const record = attendanceFor(cls.id, date)
        const absent = record ? record.absentStudentIds.length : 0
        return {
          id: cls.id,
          name: cls.name,
          grade: cls.grade,
          ageGroup: cls.ageGroup,
          students: students.length,
          optOuts,
          absent,
          present: Math.max(0, students.length - optOuts - absent),
          status: record ? 'marked' : 'unmarked',
          submittedAt: record?.submittedAt || null,
          submittedByName: record ? userById(record.submittedBy)?.fullName || null : null,
        }
      })
      .sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name, 'ru'))

    return HttpResponse.json({
      teacher: withSchoolName(user),
      schoolName: school?.name || '',
      deadline: school?.attendanceDeadline || '09:30',
      date,
      classes,
    })
  }),

  http.get(`${API}/teachers/me/attendance`, async ({ request }) => {
    await pause()
    const user = currentUser(request)
    if (!user) return HttpResponse.json({ detail: 'Не авторизован' }, { status: 401 })
    if (user.role !== 'teacher') {
      return HttpResponse.json({ detail: 'Доступно только учителям' }, { status: 403 })
    }
    const days = Number(new URL(request.url).searchParams.get('days') || 14)
    const cutoff = addDaysISO(todayISO(), -(days - 1))
    const classIds = db.classes
      .filter((cls) => (cls.teacherIds || []).includes(user.id))
      .map((cls) => cls.id)
    const items = db.attendance
      .filter((record) => classIds.includes(record.classId) && record.date >= cutoff && record.date <= todayISO())
      .map((record) => {
        const cls = classById(record.classId)
        const students = studentsOf(record.classId)
        const optOuts = students.filter((student) => student.mealStatus === 'optOut').length
        return {
          id: record.id,
          date: record.date,
          classId: record.classId,
          className: cls?.name || '—',
          grade: cls?.grade || 0,
          students: students.length,
          optOuts,
          absent: record.absentStudentIds.length,
          present: Math.max(0, students.length - optOuts - record.absentStudentIds.length),
          submittedAt: record.submittedAt || null,
          submittedByName: userById(record.submittedBy)?.fullName || null,
        }
      })
      .sort((a, b) => b.date.localeCompare(a.date) || a.className.localeCompare(b.className, 'ru'))

    return HttpResponse.json({ date: todayISO(), days, items })
  }),

  http.get(`${API}/schools/:id/attendance/summary`, async ({ params, request }) => {
    await pause()
    const date = new URL(request.url).searchParams.get('date') || todayISO()
    const summary = buildAttendanceSummary(params.id, date)
    if (!summary) return notFound('Школа не найдена')
    return HttpResponse.json(summary)
  }),

  http.get(`${API}/schools/:id/forecast`, async ({ params, request }) => {
    await pause()
    const date = new URL(request.url).searchParams.get('date') || todayISO()
    const forecast = buildForecast(params.id, date)
    if (!forecast) return notFound('Школа не найдена')
    return HttpResponse.json(forecast)
  }),

  http.post(`${API}/schools/:id/forecast/:date/approve`, async ({ params, request }) => {
    await pause()
    const school = schoolById(params.id)
    if (!school) return notFound('Школа не найдена')
    const body = await request.json().catch(() => ({}))
    const user = currentUser(request)
    db.approvals[`${params.id}:${params.date}`] = {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: user?.fullName || 'Оператор КШП',
      comment: body.comment || '',
    }
    return HttpResponse.json(buildForecast(params.id, params.date))
  }),

  http.get(`${API}/schools/:id/forecast/history`, async ({ params, request }) => {
    await pause()
    const days = Number(new URL(request.url).searchParams.get('days') || 14)
    return HttpResponse.json(buildForecastHistory(params.id, days))
  }),

  http.get(`${API}/schools/:id/canteen/forecast`, async ({ params, request }) => {
    await pause()
    const date = new URL(request.url).searchParams.get('date') || todayISO()
    const forecast = buildCanteenForecast(params.id, date)
    if (!forecast) return notFound('Школа не найдена')
    return HttpResponse.json(forecast)
  }),

  http.get(`${API}/schools/:id/canteen/sales`, async ({ params, request }) => {
    await pause()
    const days = Number(new URL(request.url).searchParams.get('days') || 14)
    return HttpResponse.json(buildCanteenSales(params.id, days))
  }),

  http.get(`${API}/schools/:id/canteen/categories`, async ({ params }) => {
    await pause()
    const school = schoolById(params.id)
    if (!school) return notFound('Школа не найдена')
    return HttpResponse.json(db.canteenCategories.filter((category) => category.schoolId === params.id))
  }),

  http.post(`${API}/schools/:id/canteen/categories`, async ({ params, request }) => {
    await pause()
    const school = schoolById(params.id)
    if (!school) return notFound('Школа не найдена')
    const body = await request.json()
    if (!body.name) return badRequest('Укажите название категории')
    const category = {
      id: createId('cat'),
      schoolId: params.id,
      name: body.name,
      share: Number(body.share ?? 0.1),
      avgPrice: Number(body.avgPrice ?? 0),
      unit: body.unit || 'порция',
    }
    db.canteenCategories.push(category)
    return HttpResponse.json(category, { status: 201 })
  }),

  http.patch(`${API}/canteen/categories/:categoryId`, async ({ params, request }) => {
    await pause()
    const category = db.canteenCategories.find((item) => item.id === params.categoryId)
    if (!category) return notFound('Категория не найдена')
    const body = await request.json()
    if (body.share !== undefined) body.share = Number(body.share)
    if (body.avgPrice !== undefined) body.avgPrice = Number(body.avgPrice)
    Object.assign(category, body)
    return HttpResponse.json(category)
  }),

  http.delete(`${API}/canteen/categories/:categoryId`, async ({ params }) => {
    await pause()
    const category = db.canteenCategories.find((item) => item.id === params.categoryId)
    if (!category) return notFound('Категория не найдена')
    db.canteenCategories = db.canteenCategories.filter((item) => item.id !== category.id)
    db.canteenSales = db.canteenSales.filter((item) => item.categoryId !== category.id)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${API}/schools/:id/access-events`, async ({ params, request }) => {
    await pause()
    const date = new URL(request.url).searchParams.get('date') || todayISO()
    const items = db.accessEvents
      .filter((event) => event.schoolId === params.id && event.date === date)
      .map(enrichAccessEvent)
      .sort((a, b) => b.time.localeCompare(a.time))
    return HttpResponse.json(items)
  }),

  http.post(`${API}/schools/:id/access-events/manual`, async ({ params, request }) => {
    await pause()
    const school = schoolById(params.id)
    if (!school) return notFound('Школа не найдена')
    const body = await request.json()
    const student = db.students.find((item) => item.id === body.studentId)
    if (!student || student.schoolId !== params.id) return notFound('Ученик не найден')
    const now = new Date()
    const event = {
      id: createId('evt'),
      schoolId: params.id,
      studentId: student.id,
      type: body.type === 'exit' ? 'exit' : 'entry',
      source: 'manual',
      date: todayISO(),
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    }
    db.accessEvents.push(event)
    return HttpResponse.json(enrichAccessEvent(event), { status: 201 })
  }),
]

export { latestAttendance }
