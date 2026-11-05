# Школьный Баланс-Пит

Бесплатный веб-сервис для прогнозирования школьного питания. Учителя отмечают
отсутствующих, завуч видит посещаемость и заявку, столовая получает количество
порций и категорий на завтра, а платформа — сводную статистику по школам.

Проект — frontend хакатонного MVP. Работает автономно на mock-данных (MSW) и готов
к подключению Python/FastAPI backend по контракту [`docs/api.md`](docs/api.md).

## Что реализовано

| Роль | Возможности |
| --- | --- |
| Администратор платформы | сводная статистика, список школ, онбординг школы, назначение и отзыв завуча, блокировка доступа |
| Завуч школы | дашборд, классы и ученики, учителя, прогноз порций, подтверждение заявки, отчёты, настройки школы |
| Учитель | свои классы, отметка отсутствующих на дату, дедлайн, история отметок |
| Столовая (КШП) | заявка на завтра по категориям, подтверждение, шведский стол, продажи, списания, история |
| Охрана (СКУД) | поиск ученика и ручная отметка входа/выхода, журнал проходов |

Дополнительно: ролевые маршруты и guard-компоненты, адаптивная вёрстка, чёрно-жёлтая
тема, русский интерфейс, CSV-экспорт и печать браузером.

## Стек

- React 19, Vite 8, React Router 7
- TanStack Query 5, Zustand
- React Hook Form + Zod
- Tailwind CSS 4, Radix UI primitives
- Recharts, date-fns, lucide-react
- MSW 3 для транспорта, Vitest 5 для тестов
- JavaScript + JSDoc (`jsconfig.json`), без TypeScript

## Быстрый старт

```bash
npm ci
npm run dev
```

Приложение: http://localhost:5173. На экране входа выберите любого демо-пользователя —
пароль не нужен.

### Демо-пользователи

| Роль | Имя | E-mail |
| --- | --- | --- |
| Администратор платформы | Ирина Соколова | admin@balancepit.by |
| Завуч, Гимназия №12 | Наталья Ковалёва | kovaleva@gym12.by |
| Завуч, Средняя школа №34 | Дмитрий Лебедев | lebedev@sch34.by |
| Учитель, 2А | Марина Соловьёва | soloveva@gym12.by |
| Учитель, 6А | Алексей Морозов | morozov@gym12.by |
| Учитель, 10А | Елена Захарова | zaharova@gym12.by |
| Столовая, школа №34 | Татьяна Мельник | melnik@kshp.by |
| Охрана, Гимназия №12 | Сергей Громов | gromov@gym12.by |

## Команды

```bash
npm run dev        # dev-сервер с MSW
npm run build      # production-сборка в dist/
npm run preview    # предпросмотр сборки
npm run lint       # oxlint
npm test           # vitest run (24 теста)
npm run test:watch # vitest в watch-режиме
```

Запуск в Docker:

```bash
docker compose up --build
# http://localhost:8080
```

## Конфигурация

Runtime-настройки лежат в `public/config.js` и читаются при загрузке страницы:

```js
window.__APP_CONFIG__ = {
  apiBaseUrl: '/api/v1',
  useMocks: true,
  authMode: 'mock',
}
```

| Поле | Назначение |
| --- | --- |
| `apiBaseUrl` | базовый URL API |
| `useMocks` | `true` — поднимать MSW и использовать фикстуры |
| `authMode` | `mock` — вход по списку демо-пользователей; `oauth` — реальный вход |

Эти же значения можно задать через `VITE_API_BASE_URL`, `VITE_USE_MOCKS=false` и
`VITE_AUTH_MODE` при сборке. `public/config.js` удобно менять без пересборки образа.

### Подключение backend

1. Установите `useMocks: false` и нужный `apiBaseUrl`.
2. Реализуйте эндпоинты из [`docs/api.md`](docs/api.md) с теми же путями и формами
   ответов.
3. Настройте CORS и cookie-сессию (`credentials: "include"`).
4. Для OAuth включите `authMode: 'oauth'`; страница `/auth/callback` уже вызывает
   `/auth/me` и перенаправляет по роли.

## Данные и моки

- Фикстуры: `src/mocks/fixtures/*.json` — 2 школы, 5 классов, 125 учеников,
  история за 14 дней, продажи столовой, события СКУД, 10 пользователей.
- Даты в фикстурах заданы через `dayOffset` и материализуются относительно
  сегодняшнего дня в `src/mocks/db.js`.
- `src/mocks/handlers.js` — полная реализация API, включая расчёт прогноза,
  буфера, заявки КШП и подтверждения.
- Состояние моков хранится в памяти и сбрасывается при перезагрузке страницы.
- Сессия хранится в `sessionStorage` под ключом `sbp-session`.

Прогноз: `present = students − optOuts − absent`, затем буфер школы:
`portions = ceil(present × (1 + bufferPercent / 100))`. Если на дату нет отметки,
используется последняя доступная; в интерфейсе показывается `basedOnDate`.

## Маршруты

```text
/login, /auth/callback, /403

/platform, /platform/schools, /platform/schools/:schoolId

/school, /school/classes, /school/classes/:classId,
/school/teachers, /school/forecast, /school/reports, /school/settings

/teacher, /teacher/attendance/:classId, /teacher/history

/canteen, /canteen/items, /canteen/history

/guard, /guard/log
```

Маршруты защищены `ProtectedRoute` и `RoleRoute`; `schoolId` берётся из сессии, а не
из URL. Неизвестный путь внутри приложения показывает 404, без сессии — редирект на
`/login`.

## Структура проекта

```text
src/
  api/            TanStack Query hooks и мутации
  app/            router, AppShell, guards, навигация
  features/       auth/session, диалоги, графики
  mocks/          MSW handlers, in-memory db, fixtures, тесты движка
  pages/          экраны по ролям (platform/school/teacher/canteen/guard)
  shared/
    api/          fetch-клиент, query keys
    config.js     runtime-конфигурация
    lib/          даты, форматирование, CSV, подписи, утилиты
    ui/           собственные компоненты в стиле shadcn (Radix + Tailwind)
docs/api.md       контракт API для backend
public/config.js  runtime-настройки демо-стенда
```

## Ограничения MVP

- Нет подписок, тарифов, оплаты и биллинга — сервис полностью бесплатный.
- Нет PWA, service worker и offline-очереди; только адаптивный web.
- Авторизация демонстрационная: выбор пользователя вместо OAuth.
- Экспорт — CSV-файл и печать браузером; серверных отчётов нет.
- Данные моков не сохраняются между перезагрузками страницы.
