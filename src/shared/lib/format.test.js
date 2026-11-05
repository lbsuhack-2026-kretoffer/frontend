import { describe, expect, it } from 'vitest'
import {
  classesLabel,
  clamp,
  formatMoney,
  formatNumber,
  formatPercent,
  initials,
  parseNumber,
  pluralRu,
  portionsLabel,
  studentsLabel,
} from './format'

const normalize = (value) => value.replace(/\u00A0/g, ' ')

describe('format helpers', () => {
  it('formats numbers for the Russian locale', () => {
    expect(normalize(formatNumber(1234.5))).toBe('1 234,5')
    expect(normalize(formatNumber('1500'))).toBe('1 500')
    expect(formatNumber(null)).toBe('—')
    expect(formatNumber(undefined)).toBe('—')
    expect(formatNumber('not-a-number')).toBe('—')
  })

  it('formats money and percentages', () => {
    expect(normalize(formatMoney(1234.5))).toBe('1 234,5 BYN')
    expect(formatMoney(null)).toBe('—')
    expect(formatPercent(12.345, 1)).toBe('12,3%')
    expect(formatPercent(50)).toBe('50%')
    expect(formatPercent(null)).toBe('—')
  })

  it('selects the correct Russian plural form', () => {
    expect(pluralRu(1, ['ученик', 'ученика', 'учеников'])).toBe('ученик')
    expect(pluralRu(2, ['ученик', 'ученика', 'учеников'])).toBe('ученика')
    expect(pluralRu(5, ['ученик', 'ученика', 'учеников'])).toBe('учеников')
    expect(pluralRu(11, ['ученик', 'ученика', 'учеников'])).toBe('учеников')
    expect(pluralRu(21, ['ученик', 'ученика', 'учеников'])).toBe('ученик')
    expect(pluralRu(112, ['ученик', 'ученика', 'учеников'])).toBe('учеников')
  })

  it('builds Russian count labels', () => {
    expect(normalize(studentsLabel(25))).toBe('25 учеников')
    expect(normalize(classesLabel(3))).toBe('3 класса')
    expect(normalize(portionsLabel(1))).toBe('1 порция')
  })

  it('derives initials from a full name', () => {
    expect(initials('Ирина Соколова')).toBe('ИС')
    expect(initials('Дмитрий Лебедев')).toBe('ДЛ')
    expect(initials('')).toBe('')
  })

  it('clamps and parses numbers', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-5, 0, 10)).toBe(0)
    expect(clamp(15, 0, 10)).toBe(10)
    expect(parseNumber('12,5')).toBe(12.5)
    expect(parseNumber('bad', 7)).toBe(7)
  })
})
