import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

export const ISO_DATE = 'yyyy-MM-dd'

export function toISODate(date) {
  return format(date, ISO_DATE)
}

export function todayISO() {
  return toISODate(new Date())
}

export function tomorrowISO() {
  return addDaysISO(todayISO(), 1)
}

export function addDaysISO(iso, days) {
  return toISODate(addDays(parseISO(iso), days))
}

export function formatDate(iso, pattern = 'd MMMM yyyy') {
  if (!iso) return '—'
  return format(parseISO(iso), pattern, { locale: ru })
}

export function formatDateShort(iso) {
  return formatDate(iso, 'd MMM')
}

export function formatWeekday(iso) {
  return formatDate(iso, 'EEEE')
}

export function formatDateRange(from, to) {
  return `${formatDate(from, 'd MMM')} — ${formatDate(to, 'd MMM yyyy')}`
}

export function offsetFromToday(iso) {
  if (!iso) return null
  return differenceInCalendarDays(parseISO(iso), new Date())
}

export function isToday(iso) {
  return iso === todayISO()
}

export function isTomorrow(iso) {
  return iso === tomorrowISO()
}

export function formatTime(iso) {
  if (!iso) return '—'
  return format(parseISO(iso), 'HH:mm')
}

export function relativeDayLabel(iso) {
  const offset = offsetFromToday(iso)
  if (offset === 0) return 'сегодня'
  if (offset === 1) return 'завтра'
  if (offset === -1) return 'вчера'
  return formatDate(iso, 'd MMMM')
}

export function lastNDates(n, endISO = todayISO()) {
  return Array.from({ length: n }, (_, index) => addDaysISO(endISO, index - (n - 1)))
}
