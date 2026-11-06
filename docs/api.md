# API контракт — Школьный Баланс-Пит (для бэкенда)

Фронтенд работает с бэкендом по `http://localhost:8000/api/v1`. OAuth не используется,
факовых/демо-данных нет — всё из реальной БД. Клиент ходит с `credentials: "include"`
(сессия в httpOnly-cookie). Ошибки возвращать в `{ "detail": "Текст" }`.

## Аутентификация

| Метод | Путь | Тело | Ответ |
| --- | --- | --- | --- |
| POST | `/auth/login` | `{ "login": "ivanov@school.by", "password": "secret123" }` | `User` |
| GET | `/auth/me` | — | `User` |
| POST | `/auth/logout` | — | `204 No Content` |

Вход по логину (e-mail или ID) и паролю. Супер-админ уже есть в БД:
- email: `admin@school-balance.by`, роль `platform_admin`, пароль задаётся при сиде.

## Роли

| Код | Кто | Что может |
| --- | --- | --- |
| `platform_admin` | Супер-админ платформы | Всё: школы, завучи, статистика, блокировка доступа |
| `school_admin` | Завуч школы | Классы, ученики, учителя, прогноз, настройки — только своя школа |
| `teacher` | Учитель | Только свои классы и отметки |
| `canteen` | Столовая / КШП | Заявка на завтра, категории, продажи — только своя школа |
| `guard` | Охрана / вахта | Ручная отметка входа/выхода, журнал — только своя школа |

## Эндпоинты

### Платформа (`platform_admin`)

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

`SchoolInput`: `name`, `city`, `address`, `phone`, `email`, `mealPlan` (`fixed`\|`canteen`),
`timezone`, `bufferPercent`, `attendanceDeadline`, опционально `adminEmail`,
`adminFullName`, `adminPassword` (завуч школы создаётся сразу со своим логином и паролем).

`GET /platform/stats`:
```json
{
  "schools": 2, "activeSchools": 1, "students": 125, "classes": 5, "teachers": 5,
  "attendance": { "present": 108, "absent": 7, "optOuts": 10,
  "markedClasses": 4, "totalClasses": 5, "date": "2026-11-05" }
}
```
`activeSchools` — школы с `accessEnabled = true`.

### Школа и классы (`school_admin`, своя школа)

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
| GET | `/schools/:id/students` | `query?`, `searchBy?` | `Student[]` с `className` |
| GET | `/schools/:id/teachers` | — | `User[]` с `classes[]` |
| POST | `/schools/:id/teachers` | `{ fullName, email, position?, password }` | `User` (201) |

Завуч регистрирует учителей (ФИО, email как логин, должность, пароль) и вахту (роль `guard`).

### Поиск учеников (только первые буквы)

`GET /schools/:id/students`:
- `query` — строка (первые буквы, регистронезависимо)
- `searchBy` — `surname` (фамилия, по умолчанию), `firstname` (имя), `middlename` (отчество)

Поиск `startsWith` по выбранному полю. Пустой `query` — все ученики школы.

### Посещаемость

| Метод | Путь | Тело / query | Ответ |
| --- | --- | --- | --- |
| GET | `/classes/:id/attendance` | `date` | `AttendanceRecord` |
| PUT | `/classes/:id/attendance` | `{ date, absentStudentIds: string[] }` | `AttendanceRecord` |
| GET | `/teachers/me/classes` | `date` | `TeacherClasses` |
| GET | `/teachers/me/attendance` | `days=14` | `{ date, days, items }` |
| GET | `/schools/:id/attendance/summary` | `date` | `AttendanceSummary` |

`PUT` идемпотентен. Учитель меняет только свои классы.

### Прогноз и заявка

| Метод | Путь | Тело / query | Ответ |
| --- | --- | --- | --- |
| GET | `/schools/:id/forecast` | `date` | `Forecast` |
| POST | `/schools/:id/forecast/:date/approve` | `{ comment? }` | `Forecast` |
| GET | `/schools/:id/forecast/history` | `days=14` | `ForecastHistoryRow[]` |
| GET | `/schools/:id/canteen/forecast` | `date` | `CanteenForecast` |
| GET | `/schools/:id/canteen/sales` | `days=14` | `CanteenSalesDay[]` |

Алгоритм заявки:
1. отметка на дату, иначе последняя доступная (`basedOnDate`);
2. `present = students − optOuts − absent`;
3. `basePortions = ceil(present × (1 + bufferPercent / 100))`;
4. ручная корректировка: `totalPortions = max(0, basePortions + adjustmentDelta)`;
5. для `canteen`: `qty = ceil(present × 0.88 × share × (1 + buffer))`.

### Корректировка заявки (±X порций, завуч / столовая своей школы)

| Метод | Путь | Тело | Ответ |
| --- | --- | --- | --- |
| GET | `/schools/:id/forecast/adjustments` | — | `ForecastAdjustment[]` |
| POST | `/schools/:id/forecast/{date}/adjust` | `{ delta: int, reason? }` | `Forecast` |
| DELETE | `/schools/:id/forecast/{date}/adjust` | — | `204` |

Одна корректировка на дату; повторный POST перезаписывает `delta` и `reason`.

### Столовая (`canteen`)

| Метод | Путь | Тело | Ответ |
| --- | --- | --- | --- |
| GET | `/schools/:id/canteen/categories` | — | `CanteenCategory[]` |
| POST | `/schools/:id/canteen/categories` | `{ name, share, avgPrice, unit }` | `CanteenCategory` (201) |
| PATCH | `/canteen/categories/:categoryId` | поля категории | `CanteenCategory` |
| DELETE | `/canteen/categories/:categoryId` | — | 204 |

`share` — 0..1, `unit` — `порция`/`шт`/`стакан`/`комплект`.

### СКУД / охрана (`guard`)

| Метод | Путь | Тело / query | Ответ |
| --- | --- | --- | --- |
| GET | `/schools/:id/access-events` | `date` | `AccessEvent[]` |
| POST | `/schools/:id/access-events/manual` | `{ studentId, type: "entry"\|"exit" }` | `AccessEvent` (201) |

Охрана — общий аккаунт школы, доступ только к своей `schoolId`.

## Модели (ответы)

`User`: `{ id, fullName, email, role, schoolId?, schoolName?, position?, avatarUrl? }`

`School`: `{ id, name, city, address, phone, email, mealPlan, timezone, bufferPercent,
attendanceDeadline, accessEnabled, createdAt, integrations: { pos, skud },
adminIds, classesCount, studentsCount, teachersCount, admins: [{ id, fullName, role, position }] }`

`Class`: `{ id, schoolId, name, grade, ageGroup, teacherIds, teacherNames, studentsCount,
optOutsCount, attendance?: { status, absentCount, submittedAt, submittedByName } }`

`Student`: `{ id, schoolId, classId, fullName, mealStatus, ageGroup, cardNumber, className }`

`AttendanceRecord`: `{ classId, className, schoolId, schoolName, date, deadline, status,
absentStudentIds, submittedAt, submittedByName, totalStudents, optOuts, students[] }`

`Forecast`: `{ schoolId, schoolName, date, mealPlan, bufferPercent, totalStudents, optOuts,
absent, present, totalPortions, adjustmentDelta, adjustmentReason, byAgeGroup[],
byCategory[], markedClasses, totalClasses, basedOnDate, confidence, status, approvedAt,
approvedBy, comment }`

`ForecastAdjustment`: `{ id, schoolId, date, delta, reason, createdBy?, createdAt? }`

`AccessEvent`: `{ id, schoolId, studentId, studentName, className, type, source, date, time }`

## Требования к реализации

1. Модель `User` содержит `password_hash`. При регистрации любого аккаунта (завуч, учитель,
   охрана) пароль обязателен и хранится хэшированным.
2. Вход — по `login` + `password`; возвращает `User` и ставит httpOnly-куку сессии.
3. CORS с `credentials: true`, origen фронтенда (`localhost:5173` dev, `localhost:8080` Docker).
4. Ошибки — `{ "detail": "..." }`.
5. Подтверждение заявки и корректировка — по паре `schoolId + date` (один на день).
6. Супер-админ `u-platform` (`admin@school-balance.by`) уже в БД после сида.

## Что исправить на бэкенде (список для разработчика)

### 1. Модель `User` — добавить поле пароля
Файл: `app/models.py`

Добавить в класс `User` поле `password_hash` (строка, не nullable, дефолтная пустая строка):

```python
class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, nullable=False)
    school_id = Column(String, ForeignKey("schools.id"), nullable=True)
    position = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    password_hash = Column(String, nullable=False, default="")
    created_at = Column(Date, nullable=False, default=date.today)
```

### 2. Хелперы аутентификации
Файл: `app/auth.py`

Добавить функции хэширования и проверки пароля (pbkdf2/sha256):

```python
import hashlib

def get_password_hash(password: str) -> str:
    return hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        settings.secret_key.encode("utf-8"),
        100_000,
    ).hex()

def verify_password(plain_password: str, password_hash: str) -> bool:
    if not password_hash:
        return False
    expected = hashlib.pbkdf2_hmac(
        "sha256",
        plain_password.encode("utf-8"),
        settings.secret_key.encode("utf-8"),
        100_000,
    ).hex()
    return hashlib.sha256(expected.encode()).digest() == hashlib.sha256(
        password_hash.encode()
    ).digest()
```

Также добавить функцию `authenticate_user(db, login, password)` — ищет пользователя по `email` или `id`, проверяет пароль, возвращает объект `User` или `None`.

### 3. Вход (`POST /auth/login`)
Файл: `app/routers/auth.py`

Тело запроса теперь `{ login: string, password: string }` (не `user_id`).

Логика:
1. Найти пользователя по `email == login` или `id == login`.
2. Если не найден — `401 { "detail": "Неверный логин или пароль" }`.
3. Если пароль не совпадает — `401 { "detail": "Неверный логин или пароль" }`.
4. Если OK — создать сессионный токен, поставить httpOnly-куку `sb_session`, вернуть `User`.

Пример ответа:
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

### 4. Регистрация завуча (`POST /platform/schools/:id/admins`)
Файл: `app/routers/platform.py`

Тело запроса теперь `{ email: string, fullName: string, password: string }` (пароль обязателен).

Логика:
1. Проверить, существует ли пользователь с таким `email`.
2. Если нет — создать `User` с ролью `school_admin`, `school_id` = школа, пароль хэшировать через `get_password_hash`.
3. Если есть — обновить роль на `school_admin`, привязать к школе, обновить пароль если передан.
4. Создать запись `SchoolAdmin(school_id=..., user_id=...)`.
5. Вернуть `School`.

### 5. Регистрация учителя и охраны (`POST /schools/:id/teachers`)
Файл: `app/routers/schools.py`

Тело запроса теперь `{ fullName: string, email: string, position?: string, password: string }` (пароль обязателен).

Роли: `teacher` — учитель, `guard` — охрана (вахта). Фронт передаёт роль через `position` или отдельное поле — бэкенд должен создавать пользователя с соответствующей ролью.

Логика:
1. Проверить уникальность `email`.
2. Создать `User` с переданной ролью, `school_id` = школа, пароль хэшировать.
3. Вернуть `User` с классами.

### 6. Создание школы (`POST /platform/schools`)
Файл: `app/routers/platform.py`

Тело `SchoolInput` дополнить опциональным полем `adminPassword: string`.

Если передан `adminEmail` + `adminFullName` + `adminPassword` — создать завуча школы сразу с этим паролем.

### 7. Сид — супер-админ
Файл: `app/seed.py`

Для пользователя `u-platform` (`admin@school-balance.by`) задать:
```python
password_hash=get_password_hash("changeme123")
```

Логин админа: `admin@school-balance.by`, пароль: `changeme123`.

### 8. CORS
Файл: `app/config.py` / `app/main.py`

Разрешить `credentials: true` и origine фронтенда:
- Разработка: `http://localhost:5173`
- Docker: `http://localhost:8080`

### 9. Формат ошибок
Все ошибки возвращать в формате `{ "detail": "Текст для пользователя" }` со статусом:
- `400` — невалидные данные
- `401` — неверный логин/пароль или нет сессии
- `403` — роль не имеет доступа
- `404` — объект не найден

### 10. Корректировка и подтверждение заявки
Хранить по паре `schoolId + date` (одна запись на день):
- Подтверждение forecast: таблица `forecast_approvals` (ключ `school_id + date`).
- Ручная корректировка: таблица `forecast_adjustments` (ключ `school_id + date`, поля `delta`, `reason`).

Повторный `POST /adjust` перезаписывает `delta` и `reason`.

