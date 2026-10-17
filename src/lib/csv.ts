import type { Referto } from '../types.ts'

const COLUMNS = [
  'data',
  'categoria',
  'girone',
  'stagione',
  'squadra_di_casa',
  'squadra_ospite',
  'gol_casa',
  'gol_ospite',
  'rigori_casa',
  'rigori_ospite',
  'penalty_shootout',
  'recupero_1t',
  'recupero_2t',
  'orario',
  'localita',
] as const

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(referti: Referto[]): string {
  const rows = referti.map((r) => COLUMNS.map((c) => escapeCell(r[c])).join(','))
  // BOM so Excel opens accented characters correctly
  return '\uFEFF' + [COLUMNS.join(','), ...rows].join('\r\n')
}

export function downloadCsv(referti: Referto[], filename: string): void {
  const blob = new Blob([toCsv(referti)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
