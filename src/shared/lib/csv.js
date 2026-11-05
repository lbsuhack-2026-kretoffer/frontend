function escapeCell(value) {
  const text = value === null || value === undefined ? '' : String(value)
  if (/[";\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

export function buildCsv(headers, rows) {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(';'))
  return `\uFEFF${lines.join('\r\n')}`
}

export function downloadCsv(filename, headers, rows) {
  const csv = buildCsv(headers, rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function printPage() {
  window.print()
}
