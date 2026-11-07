export const ROLE_LABELS = {
  platform_admin: 'Админ платформы',
  school_admin: 'Завуч',
  teacher: 'Учитель',
  canteen: 'КШП / столовая',
  guard: 'Охрана',
}

export const ROLE_HOME = {
  platform_admin: '/platform',
  school_admin: '/school',
  teacher: '/teacher',
  canteen: '/canteen',
  guard: '/guard',
}

export const AGE_GROUP_LABELS = {
  junior: 'Младшая школа',
  middle: 'Средняя школа',
  senior: 'Старшая школа',
}

export const AGE_GROUP_SHORT = {
  junior: '1–4',
  middle: '5–9',
  senior: '10–11',
}

export const AGE_GROUP_TONE = {
  junior: 'sky',
  middle: 'violet',
  senior: 'amber',
}

export const MEAL_PLAN_LABELS = {
  fixed: 'Фиксированное питание',
  canteen: 'Шведский стол',
}

export const MEAL_STATUS_LABELS = {
  regular: 'Обедает',
  optOut: 'Не обедает',
}

export const FORECAST_STATUS_LABELS = {
  draft: 'Черновик',
  approved: 'Подтверждена',
}

export const ACCESS_SOURCE_LABELS = {
  turnstile: 'Турникет',
  manual: 'Вручную',
}

export const ACCESS_TYPE_LABELS = {
  entry: 'Вход',
  exit: 'Выход',
}

export function ageGroupForGrade(grade) {
  if (grade <= 4) return 'junior'
  if (grade <= 9) return 'middle'
  return 'senior'
}
