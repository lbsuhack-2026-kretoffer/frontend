import { describe, expect, it } from 'vitest'
import { buildCsv } from './csv'

describe('buildCsv', () => {
  it('joins headers and rows with semicolons and adds a BOM', () => {
    const csv = buildCsv(
      ['Дата', 'Класс', 'Количество'],
      [
        ['2026-11-05', '6А', 25],
        ['2026-11-06', '10А', 24],
      ],
    )

    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toBe('\uFEFFДата;Класс;Количество\r\n2026-11-05;6А;25\r\n2026-11-06;10А;24')
  })

  it('escapes cells containing separators, quotes, and new lines', () => {
    const csv = buildCsv(
      ['Поле'],
      [['значение;с точкой с запятой'], ['кавычки "внутри"'], ['две\nстроки']],
    )

    expect(csv).toContain('"значение;с точкой с запятой"')
    expect(csv).toContain('"кавычки ""внутри"""')
    expect(csv).toContain('"две\nстроки"')
  })

  it('renders empty values for null and undefined', () => {
    const csv = buildCsv(['A', 'B', 'C'], [[null, undefined, 0]])
    expect(csv.endsWith('\r\n;;0')).toBe(true)
  })
})
