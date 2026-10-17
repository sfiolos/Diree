import type { Referto } from './types.ts'

const BASE = '/api'

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Errore di rete')
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function listReferti(): Promise<Referto[]> {
  return fetch(`${BASE}/referti`).then((res) => handle<Referto[]>(res))
}

export function getReferto(id: string): Promise<Referto> {
  return fetch(`${BASE}/referti/${id}`).then((res) => handle<Referto>(res))
}

export function createReferto(data: Omit<Referto, 'id' | 'created_at' | 'updated_at'>): Promise<Referto> {
  return fetch(`${BASE}/referti`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((res) => handle<Referto>(res))
}

export function updateReferto(id: string, data: Omit<Referto, 'id' | 'created_at' | 'updated_at'>): Promise<Referto> {
  return fetch(`${BASE}/referti/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((res) => handle<Referto>(res))
}

export function deleteReferto(id: string): Promise<void> {
  return fetch(`${BASE}/referti/${id}`, { method: 'DELETE' }).then((res) => handle<void>(res))
}

export interface ScrapeResult {
  [key: string]: unknown
}

export function scrapePdf(file: File): Promise<ScrapeResult> {
  const form = new FormData()
  form.append('pdf', file)
  return fetch(`${BASE}/scrape`, { method: 'POST', body: form }).then((res) => handle<ScrapeResult>(res))
}

export interface BatchItem {
  filename: string
  status: 'created' | 'duplicate' | 'failed'
  referto?: Referto
  error?: string
}

export interface BatchResult {
  results: BatchItem[]
}

export function scrapePdfBatch(files: File[]): Promise<BatchResult> {
  const form = new FormData()
  for (const f of files) form.append('pdfs', f)
  return fetch(`${BASE}/scrape/batch`, { method: 'POST', body: form }).then((res) => handle<BatchResult>(res))
}

export interface BackupResult {
  restored: number
}

export function restoreBackup(file: File): Promise<BackupResult> {
  const form = new FormData()
  form.append('backup', file)
  return fetch(`${BASE}/backup`, { method: 'POST', body: form }).then((res) => handle<BackupResult>(res))
}

export async function downloadBackup(): Promise<void> {
  const res = await fetch(`${BASE}/backup`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Errore di rete')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `diree-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}