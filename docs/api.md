# API контракт — Школьный Баланс-Пит (для бэкенда)

Фронтенд работает с бэкендом по `http://localhost:8000/api/v1`. OAuth не используется,
факовых/демо-данных нет — всё из реальной БД. Клиент ходит с `credentials: "include"`
(сессия в httpOnly-cookie). Ошибки возвращать в `{ "detail": "Текст" }`.

Бэкенд находится в `D:\GetBrain\backend-main (2)\backend-main`.

## Аутентификация

| Метод | Путь | Тело | Ответ |
| --- | --- | --- | --- |
| POST | `/auth/login` | `{ "login": "admin@school-balance.by", "password": "changeme123" }` | `User` |
| GET | `/auth/me` | — | `User` |
| POST | `/auth/logout` | — | `204 No Content` |

Вход по логину (e-mail или ID пользователя) и паролю. Супер-админ уже есть в БД:
- email: `admin@school-balance.by`, роль `platform_admin`, пароль задаётся при сиде.

Сессия хранится в httpOnly-cookie `sbp_session`. При неверных данных — `401 { "detail": "Неверный логин или пароль" }`.

## Роли

| Код | Кто | Что может |
| --- | --- | --- |
| `platform_admin` | Супер-админ платформы | Всё: школы, завучи, статистика, блокировка доступа, создание классов |
| `school_admin` | Завуч школы | Классы, ученики, учителя, прогноз, настройки — только своя школа, создание классов |
| `teacher` | Учитель | Только свои классы и отметки, **не может создавать классы** |
| `canteen` | Столовая / КШП | Заявка на завтра, категории, продажи — только своя школа |
| `guard` | Охрана / вахта | Ручная отметка входа/выхода, журнал — только своя школа |

## Модели (ответы бэкенда)

### User

```json
{
  "id": "u-platform",
  "fullName": "Ирина Ковалёва",
  "email": "admin@school-balance.by",
  "role": "platform_admin",
  "schoolId": null,
  "schoolName": null,
  "position": "Администратор платформы",
  "avatarUrl": null
}
```

### School

```json
{
  "id": "school-a",
  "name": "Гимназия №12",
  "city": "Минск",
  "address": "ул. Кальварийская, 12",
  "phone": "+375 17 200-12-12",
  "email": "gym12@edu.by",
  "mealPlan": "fixed",
  "timezone": "Europe/Minsk",
  "bufferPercent": 10,
  "attendanceDeadline": "09:30",
  "district": "Центральный",
  "accessEnabled": true,
  "createdAt": "2025-09-01T00:00:00",
  "integrations": { "pos": false, "skud": true },
  "adminIds": ["u-school-a"],
  "classesCount": 3,
  "studentsCount": 75,
  "teachersCount": 3,
  "admins": [{ "id": "u-school-a", "fullName": "Ольга Петрова", "role": "school_admin", "position": "Завуч" }]
}
```

- `mealPlan`: `fixed` — комплексные обеды, `canteen` — шведский стол (КШП).
- `accessEnabled` — флаг активности школы. Если `false` и роль не `platform_admin` — доступ запрещён.
- `createdAt` — ISO-строка даты-времени.

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
    "status": "submitted",
    "absentCount": 1,
    "submittedAt": "09:12",
    "submittedByName": "Алексей Морозов"
  } | null
}
```

- `ageGroup`: `junior` (1–4), `middle` (5–9), `senior` (10–11).
- `attendance.status`: `submitted` — отмечено, `null` — не отмечено.

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

- `mealStatus`: `regular` — обедает, `opt_out` — не обедает постоянно (в бэкенде `snake_case`).

### Attendance record

```json
{
  "classId": "class-a-6a",
  "className": "6А",
  "schoolId": "school-a",
  "schoolName": "Гимназия №12",
  "date": "2026-11-05",
  "deadline": "09:30",
  "status": "submitted",
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
      "cardNumber": "C-0026"
    }
  ]
}
```

- `status`: `submitted` — отметка сохранена, `null`/`pending` — не сохранена.
- `absentStudentIds` — массив строк ID отсутствующих.

### Forecast adjustment

```json
{
  "id": "adjust-school-a-2026-11-06",
  "schoolId": "school-a",
  "date": "2026-11-06",
  "delta": -10,
  "reason": "Экскурсия 10А",
  "createdBy": "u-school-a",
  "createdAt": "2026-11-05T08:30:00"
}
```

### Forecast

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
  "adjustmentDelta": 0,
  "adjustmentReason": null,
  "byAgeGroup": [
    { "ageGroup": "junior", "students": 25, "optOuts": 2, "absent": 1, "present": 22, "portions": 25 }
  ],
  "byCategory": [],
  "markedClasses": 3,
  "totalClasses": 3,
  "basedOnDate": "2026-11-06",
  "confidence": 0.9,
  "status": "draft",
  "approvedAt": null,
  "approvedBy": null,
  "comment": null
}
```

### Canteen forecast

```json
{
  "schoolId": "school-b",
  "schoolName": "Средняя школа №34",
  "date": "2026-11-06",
  "mealPlan": "canteen",
  "present": 65,
  "totalPortions": 72,
  "adjustmentDelta": 0,
  "byCategory": [
    { "id": "cat-hot", "schoolId": "school-b", "name": "Горячее", "share": 0.42, "avgPrice": 4.2, "unit": "порция", "qty": 26 }
  ],
  "status": "draft",
  "approvedAt": null,
  "approvedBy": null,
  "comment": null,
  "basedOnDate": "2026-11-06",
  "markedClasses": 3,
  "totalClasses": 3
}
```

### Canteen category

```json
{
  "id": "cat-hot",
  "schoolId": "school-b",
  "name": "Горячее",
  "share": 0.42,
  "avgPrice": 4.2,
  "unit": "порция"
}
```

### Canteen sale day

```json
{
  "date": "2026-11-05",
  "qty": 61,
  "amount": 260.4,
  "categories": [
    { "id": "cat-hot", "name": "Горячее", "qty": 24, "amount": 100.8 }
  ]
}
```

- `totalQty` → `qty`, `revenue` → `amount`, `wasteQty` — не возвращается.

### КШП района (комбинат школьного питания)

КШП создаётся отдельно от школы и обслуживает школы своего района. Каждый КШП имеет своё меню с ценами.

#### КШП (кухня)

```json
{
  "id": "kitchen-1",
  "name": "КШП Центральный район",
  "district": "Центральный"
}
```

#### Блюдо в меню КШП

```json
{
  "id": "menu-1",
  "kitchen_id": "kitchen-1",
  "name": "Горячее блюдо",
  "price": 4.2
}
```

#### Эндпоинты КШП (супер-админ `platform_admin`)

| Метод | Путь | Тело | Ответ |
| --- | --- | --- | --- |
| GET | `/platform/kitchens` | — | `Kitchen[]` |
| POST | `/platform/kitchens` | `{ name: string, district: string }` | `Kitchen` (201) |
| GET | `/kitchens/:kitchen_id/menu` | — | `MenuItem[]` |
| POST | `/kitchens/:kitchen_id/menu` | `{ name: string, price: number }` | `MenuItem` (201) |

Школа привязана к КШП через поле `district` — школа видит меню КШП своего района.

### Access event (журнал СКУД / вахта)

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

- `type`: `entry` — вход, `exit` — выход.
- `source`: `turnstile` — турникет, `manual` — вручную охраной.

## Эндпоинты

### Аутентификация

| Метод | Путь | Тело | Ответ | Доступ |
| --- | --- | --- | --- | --- |
| POST | `/auth/login` | `{ login: string, password: string }` | `User` | Все |
| GET | `/auth/me` | — | `User` | Авторизованные |
| POST | `/auth/logout` | — | `204` | Авторизованные |

### Платформа (супер-админ `platform_admin`)

| Метод | Путь | Тело / query | Ответ |
| --- | --- | --- | --- |
| GET | `/platform/stats` | — | сводная статистика |
| GET | `/platform/schools` | `query`, `page`, `pageSize` | `{ items, total, page, pageSize }` |
| POST | `/platform/schools` | `SchoolInput` | `School` (201) |
| GET | `/platform/schools/:id` | — | `School` |
| PATCH | `/platform/schools/:id` | поля `School`, `integrations` | `School` |
| POST | `/platform/schools/:id/admins` | `{ email, fullName, password }` | `School` |
| DELETE | `/platform/schools/:id/admins/:userId` | — | `School` |
| POST | `/platform/schools/:id/access` | `{ enabled: boolean }` | `School` |
| GET | `/platform/kitchens` | — | `Kitchen[]` |
| POST | `/platform/kitchens` | `{ name: string, district: string }` | `Kitchen` (201) |
| GET | `/kitchens/:kitchen_id/menu` | — | `MenuItem[]` |
| POST | `/kitchens/:kitchen_id/menu` | `{ name: string, price: number }` | `MenuItem` (201) |

`SchoolInput`: `name`, `city`, `address`, `phone`, `email`, `mealPlan` (`fixed`\|`canteen`),
`timezone`, `bufferPercent`, `attendanceDeadline`, `district`, опционально `adminEmail`,
`adminFullName`, `adminPassword`.

Школа привязана к КШП через поле `district` — школа видит меню КШП своего района.

### Школа и классы (завуч `school_admin`, своя школа; админ `platform_admin` — все школы)

| Метод | Путь | Тело / query | Ответ |
| --- | --- | --- | --- |
| GET | `/schools/:id` | — | `School` |
| PATCH | `/schools/:id` | поля `School`, `integrations` | `School` |
| GET | `/schools/:id/classes` | `date?` | `Class[]` |
| POST | `/schools/:id/classes` | **`ClassCreateWithStudentsInput`** | `Class` (201) |
| GET | `/classes/:id` | `date?` | `Class` |
| PATCH | `/classes/:id` | `{ name?, grade?, ageGroup?, teacherId? }` | `Class` |
| DELETE | `/classes/:id` | — | 204 |
| GET | `/classes/:id/students` | — | `Student[]` |
| POST | `/classes/:id/students` | `{ fullName, mealStatus? }` | `Student` (201) |
| POST | `/classes/:id/teacher` | `{ teacherId }` | `Class` |
| PATCH | `/students/:id` | `{ fullName?, mealStatus? }` | `Student` |
| DELETE | `/students/:id` | — | 204 |
| GET | `/schools/:id/students` | `query?`, `search_by?` | `Student[]` с `className` |
| GET | `/schools/:id/teachers` | — | `User[]` с `classes[]` |
| POST | `/schools/:id/teachers` | `{ fullName, email, position?, password, role? }` | `User` (201) |

Завуч регистрирует учителей (`role: "teacher"`) и вахту (`role: "guard"`). Учителя **не могут** создавать классы.

### Создание класса по плану

`POST /schools/:id/classes` — создание класса с即时 набором учеников:

**Тело запроса:**

```json
{
  "grade": 6,
  "letter": "А",
  "studentsCount": 25,
  "studentNames": ["Иванов Иван Иванович", "Петров Петр Петрович", "Сидорова Анна Сергеевна"]
}
```

| Поле | Тип | Описание |
| --- | --- | --- |
| `grade` | `int` (1–11) | Номер класса |
| `letter` | `string` (1–2 симв.) | Буква класса (А, Б, В…) |
| `studentsCount` | `int` (1–60) | Количество учеников |
| `studentNames` | `string[]` | ФИО каждого ученика |

Название класса формируется как `{grade}{letter}` (например, `6А`).
Возрастная группа вычисляется автоматически: 1–4 → junior, 5–9 → middle, 10–11 → senior.

### Поиск учеников (только первые буквы)

`GET /schools/:id/students`:
- `query` — строка (первые буквы, регистронезависимо)
- `search_by` — `surname` (фамилия, по умолчанию), `firstname` (имя), `middlename` (отчество)

Поиск `startsWith` по выбранному полю. Пустой `query` — все ученики школы.

### Посещаемость

| Метод | Путь | Тело / query | Ответ |
| --- | --- | --- | --- |
| GET | `/classes/:id/attendance` | `date` | `AttendanceRecord` |
| PUT | `/classes/:id/attendance` | `{ date, absentStudentIds: string[] }` | `AttendanceRecord` |
| GET | `/teachers/me/classes` | `date` | `{ schoolId, schoolName, date, deadline, classes[] }` |
| GET | `/teachers/me/attendance` | `days=14` | `{ date, days, items[] }` |
| GET | `/schools/:id/attendance/summary` | `date` | `{ date, totalStudents, present, absent, optOuts, markedClasses, totalClasses }` |

`PUT` идемпотентен. Учитель меняет только свои классы.
`attendance.summary` не возвращает массив классов со статусом — только числа.

### Прогноз и заявка

| Метод | Путь | Тело / query | Ответ |
| --- | --- | --- | --- |
| GET | `/schools/:id/forecast` | `date` | `Forecast` |
| POST | `/schools/:id/forecast/:date/approve` | `{ comment? }` | `Forecast` |
| GET | `/schools/:id/forecast/history` | `days=14` | `Forecast[]` |
| GET | `/schools/:id/canteen/forecast` | `date` | `Canteen forecast` |
| GET | `/schools/:id/canteen/sales` | `days=14` | `Canteen sale day[]` |

### Корректировка заявки (завуч / столовая своей школы)

| Метод | Путь | Тело | Ответ |
| --- | --- | --- | --- |
| GET | `/schools/:id/forecast/adjustments` | — | `ForecastAdjustment[]` |
| POST | `/schools/:id/forecast/{date}/adjust` | `{ delta: int, reason? }` | `Forecast` |
| DELETE | `/schools/:id/forecast/{date}/adjust` | — | `204` |

### Столовая (`canteen`)

| Метод | Путь | Тело | Ответ |
| --- | --- | --- | --- |
| GET | `/schools/:id/canteen/categories` | — | `CanteenCategory[]` |
| POST | `/schools/:id/canteen/categories` | `{ name, share, avgPrice, unit }` | `CanteenCategory` (201) |
| PATCH | `/canteen/categories/:categoryId` | поля категории | `CanteenCategory` |
| DELETE | `/canteen/categories/:categoryId` | — | 204 |

### СКУД / охрана (`guard`)

| Метод | Путь | Тело / query | Ответ |
| --- | --- | --- | --- |
| GET | `/schools/:id/access-events` | `date` | `AccessEvent[]` |
| POST | `/schools/:id/access-events/manual` | `{ studentId, type: "entry"\|"exit" }` | `AccessEvent` (201) |

## Валидация полей ввода

Все поля ввода валидируются на бэкенде и фронтенде:

| Поле | Правила |
| --- | --- |
| `address` | Обязательное, минимум 5 символов |
| `phone` | Обязательное, формат `+7XXXXXXXXXX` или `8XXXXXXXXXX` |
| `email` | Обязательный, валидный e-mail |
| `name` (школа/класс) | Обязательное, минимум 2 символа |
| `city` | Обязательное, минимум 2 символа |
| `grade` | Цeloе число 1–11 |
| `letter` | 1–2 символа (буква класса) |
| `studentsCount` | 1–60 |
| `studentNames` | Каждое ФИО минимум 2 символа, разделены пробелом или переносом строки |
| `password` | Минимум 6 символов |
| `bufferPercent` | 0–30% |
| `attendanceDeadline` | Формат `HH:MM` |

## Требования к реализации

1. Модель `User` содержит `password_hash`. При регистрации любого аккаунта пароль обязателен.
2. Вход — по `login` + `password`; httpOnly-кука `sbp_session`.
3. CORS с `credentials: true`, origen фронтенда (`localhost:5173` dev, `localhost:8080` Docker).
4. Ошибки — `{ "detail": "..." }`.
5. Супер-админ `u-platform` (`admin@school-balance.by`, пароль `changeme123`) уже в БД после сида.
6. `mealStatus` в бэкенде — `opt_out` (не `optOut`).
7. Статус посещаемости — `submitted` (не `marked`), отсутствие отметки — `null`/`pending`.
8. `attendance.summary` не возвращает массив классов — только числа.
9. График реальной посещаемости и прогноза (`ForecastChart`) отображается на дашборде школы и странице прогноза.
10. Учителя не могут создавать классы — только просматривать свои.
