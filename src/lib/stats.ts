import type { Referto, Sanzione } from '../types.ts'

export interface KeyNumbers {
  matches: number
  totalGoals: number
  avgGoals: number
  playerYellows: number
  avgPlayerYellows: number
  playerReds: number
  avgPlayerReds: number
  otherYellows: number
  avgOtherYellows: number
  otherReds: number
  avgOtherReds: number
}

export function isPlayerSanction(s: Sanzione): boolean {
  return s.tipo_soggetto === 'giocatore'
}

export function isOtherSanction(s: Sanzione): boolean {
  return !isPlayerSanction(s)
}

export function isYellow(s: Sanzione): boolean {
  return s.ammonizione
}

export function isRed(s: Sanzione): boolean {
  return !s.ammonizione
}

export function computeKeyNumbers(referti: Referto[]): KeyNumbers {
  const matches = referti.length
  let totalGoals = 0
  let playerYellows = 0
  let playerReds = 0
  let otherYellows = 0
  let otherReds = 0

  for (const r of referti) {
    totalGoals += r.gol_casa + r.gol_ospite
    for (const s of r.sanzioni) {
      if (isPlayerSanction(s)) {
        if (isYellow(s)) playerYellows += 1
        else playerReds += 1
      } else {
        if (isYellow(s)) otherYellows += 1
        else otherReds += 1
      }
    }
  }

  return {
    matches,
    totalGoals,
    avgGoals: matches ? totalGoals / matches : 0,
    playerYellows,
    avgPlayerYellows: matches ? playerYellows / matches : 0,
    playerReds,
    avgPlayerReds: matches ? playerReds / matches : 0,
    otherYellows,
    avgOtherYellows: matches ? otherYellows / matches : 0,
    otherReds,
    avgOtherReds: matches ? otherReds / matches : 0,
  }
}

export type MatchResult = 'vittoria_casa' | 'vittoria_ospite' | 'pareggio'

export interface BarDatum {
  key: string
  label: string
  value: number
  percentage: number
}

export function matchResultDistribution(referti: Referto[]): BarDatum[] {
  const counts: Record<MatchResult, number> = { vittoria_casa: 0, vittoria_ospite: 0, pareggio: 0 }
  for (const r of referti) {
    if (r.gol_casa > r.gol_ospite) counts.vittoria_casa += 1
    else if (r.gol_casa < r.gol_ospite) counts.vittoria_ospite += 1
    else counts.pareggio += 1
  }
  const total = referti.length
  const labels: Record<MatchResult, string> = {
    vittoria_casa: 'Vittoria casa',
    vittoria_ospite: 'Vittoria ospite',
    pareggio: 'Pareggio',
  }
  return (Object.keys(counts) as MatchResult[]).map((k) => ({
    key: k,
    label: labels[k],
    value: counts[k],
    percentage: total ? (counts[k] / total) * 100 : 0,
  }))
}

export interface GoalsDistribution {
  goals: number
  matches: number
}

export function goalsPerMatchDistribution(referti: Referto[]): GoalsDistribution[] {
  const counts = new Map<number, number>()
  for (const r of referti) {
    const g = r.gol_casa + r.gol_ospite
    counts.set(g, (counts.get(g) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([goals, matches]) => ({ goals, matches }))
}

export interface SanctionsDistribution {
  weightedSanctions: number
  matches: number
}

export function sanctionsPerMatchDistribution(referti: Referto[]): SanctionsDistribution[] {
  const counts = new Map<number, number>()
  for (const r of referti) {
    let weighted = 0
    for (const s of r.sanzioni) {
      weighted += isYellow(s) ? 1 : 2
    }
    counts.set(weighted, (counts.get(weighted) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([weightedSanctions, matches]) => ({ weightedSanctions, matches }))
}

const INTERVAL_MIN = 5
const STOMPAGE_THRESHOLD = 90

function parseMinute(minuto: string): { base: number; stoppage: number } | null {
  const m = minuto.match(/^(\d+)\s*\+\s*(\d+)$/)
  if (m) return { base: Number(m[1]), stoppage: Number(m[2]) }
  const plain = minuto.match(/^(\d+)$/)
  if (plain) return { base: Number(plain[1]), stoppage: 0 }
  return null
}

export function normalizedMinute(tempo: string, minuto: string): number | null {
  const parsed = parseMinute(minuto)
  if (!parsed) return null
  const offset = tempo === '2T' ? 45 : 0
  return offset + parsed.base + parsed.stoppage
}

export interface SanctionInterval {
  label: string
  count: number
  percentage: number
}

export function sanctionsByInterval(referti: Referto[]): SanctionInterval[] {
  const counts = new Map<number, number>()
  let total = 0
  for (const r of referti) {
    for (const s of r.sanzioni) {
      const minute = normalizedMinute(s.tempo, s.minuto)
      if (minute === null) continue
      const bucket = Math.min(Math.floor(minute / INTERVAL_MIN), STOMPAGE_THRESHOLD / INTERVAL_MIN)
      counts.set(bucket, (counts.get(bucket) ?? 0) + 1)
      total += 1
    }
  }
  const out: SanctionInterval[] = []
  for (let i = 0; i <= STOMPAGE_THRESHOLD / INTERVAL_MIN; i++) {
    const count = counts.get(i) ?? 0
    const start = i * INTERVAL_MIN
    const label = start >= STOMPAGE_THRESHOLD ? `${STOMPAGE_THRESHOLD}+` : `${start}–${start + INTERVAL_MIN}`
    out.push({ label, count, percentage: total ? (count / total) * 100 : 0 })
  }
  return out
}

export interface MicroReasonDatum {
  label: string
  count: number
  percentage: number
}

export function playerSanctionsByMicroReason(referti: Referto[]): MicroReasonDatum[] {
  const counts = new Map<string, number>()
  let total = 0
  for (const r of referti) {
    for (const s of r.sanzioni) {
      if (!isPlayerSanction(s)) continue
      const reason = s.motivo_micro.trim()
      if (!reason) continue
      counts.set(reason, (counts.get(reason) ?? 0) + 1)
      total += 1
    }
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count, percentage: total ? (count / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count)
}

export function formatAverage(n: number): string {
  return n.toFixed(2)
}