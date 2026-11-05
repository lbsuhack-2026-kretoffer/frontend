const numberFormat = new Intl.NumberFormat('ru-RU')

export function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return numberFormat.format(Number(value))
}

export function formatMoney(value, currency = 'BYN') {
  if (value === null || value === undefined) return '—'
  return `${numberFormat.format(Number(value))} ${currency}`
}

export function formatPercent(value, digits = 0) {
  if (value === null || value === undefined) return '—'
  return `${Number(value).toFixed(digits).replace('.', ',')}%`
}

export function pluralRu(count, forms) {
  const value = Math.abs(Number(count))
  const mod10 = value % 10
  const mod100 = value % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}

export function portionsLabel(count) {
  return `${formatNumber(count)} ${pluralRu(count, ['порция', 'порции', 'порций'])}`
}

export function studentsLabel(count) {
  return `${formatNumber(count)} ${pluralRu(count, ['ученик', 'ученика', 'учеников'])}`
}

export function classesLabel(count) {
  return `${formatNumber(count)} ${pluralRu(count, ['класс', 'класса', 'классов'])}`
}

export function initials(fullName = '') {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function parseNumber(value, fallback = 0) {
  const parsed = Number(String(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : fallback
}
