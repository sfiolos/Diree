import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { RefertiFile, Referto } from '../src/types.ts'

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data')
const DATA_FILE = join(DATA_DIR, 'referti.json')

const DEFAULT_FILE: RefertiFile = { version: '1.0.0', referti: [] }

function ensureFile(): void {
  if (!existsSync(DATA_FILE)) {
    mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_FILE, null, 2), 'utf8')
  }
}

export function readReferti(): RefertiFile {
  ensureFile()
  const raw = readFileSync(DATA_FILE, 'utf8')
  try {
    return JSON.parse(raw) as RefertiFile
  } catch {
    return DEFAULT_FILE
  }
}

export function writeReferti(file: RefertiFile): void {
  ensureFile()
  writeFileSync(DATA_FILE, JSON.stringify(file, null, 2), 'utf8')
}

export function findReferto(id: string): Referto | undefined {
  return readReferti().referti.find((r) => r.id === id)
}