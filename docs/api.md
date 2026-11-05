# API контракт — Школьный Баланс-Пит

Документ описывает HTTP API, который ожидает фронтенд. В демо-режиме те же запросы
обслуживает MSW (`src/mocks/handlers.js`), в production — Python/FastAPI backend.

## Базовые соглашения

- Базовый URL: `/api/v1` (настраивается в `public/config.js` → `apiBaseUrl`).
- Формат: JSON (`Content-Type: application/json`), кодировка UTF-8.
- Даты: `YYYY-MM-DD`; дата-время: ISO 8601 (`2026-11-05T09:14:00+03:00`).
- Деньги: число в BYN (`4.2`), без строковой валюты.
- Идентификаторы: строки (`school-a`, `class-a-6a`, `u-teach-a-1`).
- Пустой ответ: `204 No Content`.
- Ошибка: `{ "detail": "Текст для пользователя" }`.
  - `400` — невалидные данные;
  - `401` — нет сессии;
  - `403` — роль не имеет доступа;
  - `404` — объект не найден.

### Аутентификация

Демо-режим: клиент передаёт заголовок `X-Demo-User: <userId>` (только при
`authMode: "mock"`). После перехода на реальный OAuth cookie-сессия отправляется
автоматически (`credentials: "include"`), заголовок не нужен.

### Роли

| Роль | Код | Доступ |
| --- | --- | --- |
| Администратор платформы | `platform_admin` | школы, завучи, блокировка, сводная статистика |
| Завуч / администратор школы | `school_admin` | классы, ученики, учителя, прогноз, отчёты, настройки |
| Учитель | `teacher` | свои классы, отметка отсутствующих, история |
| Столовая / КШП | `canteen` | заявка на завтра, категории, продажи, списания |
| Охрана / СКУД | `guard` | ручная отметка прохода, журнал |

## Сущности

### User

```json
{
  "id": "u-teach-a-1",
  "fullName": "Марина Соловьёва",
  "email": "soloveva@gym12.by",
  "role": "teacher",
  "schoolId": "school-a",
  "schoolName": "Гимназия №12",
  "position": "Учитель начальных классов",
  "avatarUrl": null
}
```

### School

```json
{
  "id": "school-b",
  "name": "Средняя школа №34",
  "city": "Минск",
  "address": "пр-т Независимости, 34",
  "phone": "+375 17 765-43-21",
  "email": "sch34@edu.by",
  "mealPlan": "canteen",
  "timezone": "Europe/Minsk",
  "bufferPercent": 8,
  "attendanceDeadline": "09:15",
  "accessEnabled": true,
  "createdAt": "2025-09-01",
  "integrations": { "pos": true, "skud": false },
  "adminIds": ["u-school-b"],
  "classesCount": 2,
  "studentsCount": 50,
  "teachersCount": 2,
  "admins": [{ "id": "u-school-b", "fullName": "Дмитрий Лебедев" }]
}
```

`mealPlan`: `fixed` — комплексные обеды, `canteen` — шведский стол по категориям.

### Class

```json
{
  "id": "class-a-6a",
  "schoolId": "school-a",
  "name": "6А",
  "grade": 6,
  "ageGroup": "middle",
  "teacherIds": ["u-teach-a-2"],
  "teacherNames": ["Алексей Морозов"],
  "studentsCount": 25,
  "optOutsCount": 2,
  "attendance": {
    "status": "marked",
    "absentCount": 1,
    "submittedAt": "09:12",
    "submittedByName": "Алексей Морозов"
  }
}
```

`ageGroup`: `junior` (1–4), `middle` (5–9), `senior` (10–11).
Блок `attendance` присутствует, только если запрошена конкретная дата.

### Student

```json
{
  "id": "s-1",
  "schoolId": "school-a",
  "classId": "class-a-2a",
  "fullName": "Соколов Артём",
  "mealStatus": "regular",
  "ageGroup": "junior",
  "cardNumber": "C-0001",
  "className": "2А"
}
```

`mealStatus`: `regular` — обедает, `optOut` — постоянный отказ (исключается из прогноза).

### Attendance record

```json
{
  "classId": "class-a-6a",
  "className": "6А",
  "schoolId": "school-a",
  "schoolName": "Гимназия №12",
  "date": "2026-11-05",
  "deadline": "09:30",
  "status": "marked",
  "absentStudentIds": ["s-26"],
  "submittedAt": "09:12",
  "submittedByName": "Алексей Морозов",
  "totalStudents": 25,
  "optOuts": 2,
  "students": [
    {
      "id": "s-26",
      "fullName": "Абрамов Илья",
      "mealStatus": "regular",
      "cardNumber": "C-0026",
      "absent": true
    }
  ]
}
```

### Forecast (fixed)

```json
{
  "schoolId": "school-a",
  "schoolName": "Гимназия №12",
  "date": "2026-11-06",
  "mealPlan": "fixed",
  "bufferPercent": 10,
  "totalStudents": 75,
  "optOuts": 6,
  "absent": 4,
  "present": 65,
  "totalPortions": 72,
  "byAgeGroup": [
    { "ageGroup": "junior", "students": 25, "optOuts": 2, "absent": 1, "present": 22, "portions": 25 }
  ],
  "byCategory": [],
  "markedClasses": 3,
  "totalClasses": 3,
  "basedOnDate": "2026-11-06",
  "confidence": 0.93,
  "status": "draft",
  "approvedAt": null,
  "approvedBy": null,
  "comment": ""
}
```

`status`: `draft` | `approved`. `basedOnDate` — дата самой старой отметки,
использованной для классов без отметки на запрошенный день.

### Canteen forecast

Расширяет `Forecast` полями:

```json
{
  "categories": [
    {
      "id": "cat-hot",
      "schoolId": "school-b",
      "name": "Горячее",
      "share": 0.42,
      "avgPrice": 4.2,
      "unit": "порция",
      "qty": 26,
      "revenue": 109.2,
      "yesterdayQty": 24,
      "wasteQty": 1,
      "history": [{ "date": "2026-11-04", "qty": 24, "wasteQty": 1 }]
    }
  ],
  "yesterdayDate": "2026-11-05",
  "yesterdayTotalQty": 61,
  "totalForecastQty": 62,
  "expectedRevenue": 260.4
}
```

## Эндпоинты

### Аутентификация

| Метод | Путь | Описание |
| --- | --- | --- |
| GET | `/auth/demo-users` | список демо-пользователей с `classes` для учителей |
| POST | `/auth/login` | вход по `{ "userId": "u-teach-a-1" }`, возвращает `User` |
| GET | `/auth/me` | текущий пользователь по сессии / `X-Demo-User` |

### Платформа (`platform_admin`)

| Метод | Путь | Тело / query | Ответ |
| --- | --- | --- | --- |
| GET | `/platform/stats` | — | сводная статистика |
| GET | `/platform/schools` | `query`, `page`, `pageSize` | `{ items, total, page, pageSize }` |
| POST | `/platform/schools` | `SchoolInput` | `School` (201) |
| GET | `/platform/schools/:id` | — | `School` |
| PATCH | `/platform/schools/:id` | поля `School` | `School` |
| POST | `/platform/schools/:id/admins` | `{ email, fullName }` | `School` |
| DELETE | `/platform/schools/:id/admins/:userId` | — | `School` |
| POST | `/platform/schools/:id/access` | `{ enabled: boolean }` | `School` |

`GET /platform/stats`:

```json
{
  "schools": 2,
  "activeSchools": 2,
  "students": 125,
  "classes": 5,
  "teachers": 5,
  "attendance": {
    "present": 108,
    "absent": 7,
    "optOuts": 10,
    "markedClasses": 4,
    "totalClasses": 5,
    "date": "2026-11-05"
  }
}
```

`SchoolInput` при создании: `name`, `city`, `address`, `phone`, `email`, `mealPlan`,
`timezone`, `bufferPercent`, `attendanceDeadline`, а также опционально
`adminEmail`, `adminFullName` — завуч создаётся/назначается сразу.

### Школа и классы (`school_admin`)

| Метод | Путь | Тело / query | Ответ |
| --- | --- | --- | --- |
| GET | `/schools/:id` | — | `School` |
| PATCH | `/schools/:id` | поля `School`, `integrations` | `School` |
| GET | `/schools/:id/classes` | `date?` | `Class[]` |
| POST | `/schools/:id/classes` | `{ name, grade, ageGroup?, teacherId? }` | `Class` (201) |
| GET | `/classes/:id` | `date?` | `Class` |
| PATCH | `/classes/:id` | `{ name?, grade?, ageGroup?, teacherId? }` | `Class` |
| DELETE | `/classes/:id` | — | 204 |
| GET | `/classes/:id/students` | — | `Student[]` |
| POST | `/classes/:id/students` | `{ fullName, mealStatus? }` | `Student` (201) |
| POST | `/classes/:id/teacher` | `{ teacherId }` | `Class` |
| PATCH | `/students/:id` | `{ fullName?, mealStatus? }` | `Student` |
| DELETE | `/students/:id` | — | 204 |
| GET | `/schools/:id/students` | `query?` | `Student[]` с `className` |
| GET | `/schools/:id/teachers` | — | `User[]` с `classes[]` |
| POST | `/schools/:id/teachers` | `{ fullName, email, position? }` | `User` (201) |

### Посещаемость

| Метод | Путь | Тело / query | Ответ |
| --- | --- | --- | --- |
| GET | `/classes/:id/attendance` | `date` | `AttendanceRecord` |
| PUT | `/classes/:id/attendance` | `{ date, absentStudentIds: string[] }` | `AttendanceRecord` |
| GET | `/teachers/me/classes` | `date` | `TeacherClasses` |
| GET | `/teachers/me/attendance` | `days=14` | `{ date, days, items }` |
| GET | `/schools/:id/attendance/summary` | `date` | `AttendanceSummary` |

`PUT` идемпотентен: повторная отметка за тот же день перезаписывает
`absentStudentIds` и время. Учитель может менять только свои классы.

`TeacherClasses`:

```json
{
  "teacher": { "id": "u-teach-a-1", "fullName": "Марина Соловьёва" },
  "schoolName": "Гимназия №12",
  "deadline": "09:30",
  "date": "2026-11-05",
  "classes": [
    {
      "id": "class-a-2a",
      "name": "2А",
      "grade": 2,
      "ageGroup": "junior",
      "students": 25,
      "optOuts": 2,
      "absent": 1,
      "present": 22,
      "status": "marked",
      "submittedAt": "09:12",
      "submittedByName": "Марина Соловьёва"
    }
  ]
}
```

`AttendanceSummary`:

```json
{
  "schoolId": "school-a",
  "date": "2026-11-05",
  "totalStudents": 75,
  "optOuts": 6,
  "absent": 4,
  "present": 65,
  "markedClasses": 2,
  "totalClasses": 3,
  "classes": [
    {
      "id": "class-a-6a",
      "name": "6А",
      "ageGroup": "middle",
      "students": 25,
      "optOuts": 2,
      "absent": 1,
      "present": 22,
      "status": "marked",
      "submittedAt": "09:12",
      "submittedByName": "Алексей Морозов",
      "teacherNames": ["Алексей Морозов"]
    }
  ]
}
```

### Прогноз и заявка

| Метод | Путь | Тело / query | Ответ |
| --- | --- | --- | --- |
| GET | `/schools/:id/forecast` | `date` | `Forecast` |
| POST | `/schools/:id/forecast/:date/approve` | `{ comment? }` | `Forecast` |
| GET | `/schools/:id/forecast/history` | `days=14` | `ForecastHistoryRow[]` |
| GET | `/schools/:id/canteen/forecast` | `date` | `CanteenForecast` |
| GET | `/schools/:id/canteen/sales` | `days=14` | `CanteenSalesDay[]` |

`ForecastHistoryRow`: `{ date, forecast, actual, wastePortions, wasteCost, accuracy, confidence, bufferPercent }`.

`CanteenSalesDay`: `{ date, totalQty, revenue, wasteQty, byCategory: [{ id, name, qty, revenue, wasteQty }] }`.

Алгоритм заявки (реализация может быть заменена backend-ом при сохранении формы ответа):

1. Для каждого класса берётся отметка на запрошенную дату.
2. Если отметки нет — последняя доступная отметка не позже даты (`basedOnDate`).
3. `present = students − optOuts − absent`.
4. `portions = ceil(present × (1 + bufferPercent / 100))`.
5. Для `canteen` категории: `qty = ceil(present × 0.88 × share × (1 + buffer))`.
6. Подтверждение сохраняется отдельно по ключу `schoolId + date` и не меняет расчёт.

### Столовая (`canteen`)

| Метод | Путь | Тело | Ответ |
| --- | --- | --- | --- |
| GET | `/schools/:id/canteen/categories` | — | `CanteenCategory[]` |
| POST | `/schools/:id/canteen/categories` | `{ name, share, avgPrice, unit }` | `CanteenCategory` (201) |
| PATCH | `/canteen/categories/:categoryId` | любые поля категории | `CanteenCategory` |
| DELETE | `/canteen/categories/:categoryId` | — | 204 |

`share` — доля спроса (`0..1`), `avgPrice` — средняя цена в BYN, `unit` — `порция`,
`шт`, `стакан`, `комплект`.

### СКУД / охрана (`guard`)

| Метод | Путь | Тело / query | Ответ |
| --- | --- | --- | --- |
| GET | `/schools/:id/access-events` | `date` | `AccessEvent[]` |
| POST | `/schools/:id/access-events/manual` | `{ studentId, type: "entry" \| "exit" }` | `AccessEvent` (201) |

```json
{
  "id": "evt-1001",
  "schoolId": "school-a",
  "studentId": "s-1",
  "studentName": "Соколов Артём",
  "className": "2А",
  "type": "entry",
  "source": "manual",
  "date": "2026-11-05",
  "time": "08:47"
}
```

`source`: `turnstile` | `manual`. События сортируются по времени по убыванию.

## Интеграция с backend

1. Установить `useMocks: false` и `apiBaseUrl` в `public/config.js` (или
   `VITE_USE_MOCKS=false`, `VITE_API_BASE_URL`).
2. Реализовать эндпоинты с теми же путями и полями ответов.
3. Настроить CORS и cookie-сессию (`credentials: include`), если backend на другом
   origin.
4. При переходе на OAuth установить `authMode: "oauth"` и реализовать
   `/auth/callback` (страница уже открывается по этому маршруту).
5. Ошибки возвращать в `{ "detail": "..." }` — клиент показывает текст пользователю.
6. Для заявки сохранять подтверждение по паре `schoolId + date`, чтобы повторный
   `POST /approve` был идемпотентным.
