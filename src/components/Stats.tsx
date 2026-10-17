import { useMemo } from 'react'
import type { Referto } from '../types.ts'
import BarChart from './BarChart.tsx'
import {
  computeKeyNumbers,
  formatAverage,
  goalsPerMatchDistribution,
  matchResultDistribution,
  playerSanctionsByMicroReason,
  sanctionsByInterval,
  sanctionsPerMatchDistribution,
} from '../lib/stats.ts'

interface StatsProps {
  referti: Referto[]
}

function pct(value: number): string {
  return `${value.toFixed(1)}%`
}

function KeyNumber({ value, label }: { value: string; label: string }) {
  return (
    <div className="key-number">
      <div className="key-number-value">{value}</div>
      <div className="key-number-label">{label}</div>
    </div>
  )
}

function Stats({ referti }: StatsProps) {
  const key = useMemo(() => computeKeyNumbers(referti), [referti])
  const results = useMemo(() => matchResultDistribution(referti), [referti])
  const goals = useMemo(() => goalsPerMatchDistribution(referti), [referti])
  const sanctions = useMemo(() => sanctionsPerMatchDistribution(referti), [referti])
  const intervals = useMemo(() => sanctionsByInterval(referti), [referti])
  const micro = useMemo(() => playerSanctionsByMicroReason(referti), [referti])

  return (
    <div className="stats">
      <section className="stats-section">
        <h6 className="stats-title">Key Numbers</h6>
        <div className="key-numbers">
          <KeyNumber value={String(key.matches)} label="Numero di partite" />
          <KeyNumber value={String(key.totalGoals)} label="Gol totali" />
          <KeyNumber value={formatAverage(key.avgGoals)} label="Media gol / partita" />
          <KeyNumber value={String(key.playerYellows)} label="Ammonizioni calciatori" />
          <KeyNumber value={formatAverage(key.avgPlayerYellows)} label="Media ammonizioni calciatori" />
          <KeyNumber value={String(key.playerReds)} label="Espulsioni calciatori" />
          <KeyNumber value={formatAverage(key.avgPlayerReds)} label="Media espulsioni calciatori" />
          <KeyNumber value={String(key.otherYellows)} label="Ammonizioni dirigenti" />
          <KeyNumber value={formatAverage(key.avgOtherYellows)} label="Media ammonizioni dirigenti" />
          <KeyNumber value={String(key.otherReds)} label="Espulsioni dirigenti" />
          <KeyNumber value={formatAverage(key.avgOtherReds)} label="Media espulsioni dirigenti" />
        </div>
      </section>

      <section className="stats-section">
        <h6 className="stats-title">Distribuzione esiti partita</h6>
        <p className="stats-caption">
          Percentuale di partite concluse con vittoria della squadra di casa, vittoria della squadra ospite o pareggio.
        </p>
        {referti.length === 0 ? (
          <p className="text-muted small mb-0">Nessuna partita selezionata.</p>
        ) : (
          <BarChart
            height={280}
            data={results.map((r) => ({ label: r.label, value: r.percentage, display: pct(r.percentage) }))}
            format={(v) => pct(v)}
          />
        )}
      </section>

      <section className="stats-section">
        <h6 className="stats-title">Gol per partita</h6>
        <p className="stats-caption">
          Numero di partite in cui sono stati segnati 0, 1, 2, … goal complessivi.
        </p>
        {goals.length === 0 ? (
          <p className="text-muted small mb-0">Nessuna partita selezionata.</p>
        ) : (
          <BarChart data={goals.map((g) => ({ label: String(g.goals), value: g.matches, display: String(g.matches) }))} />
        )}
      </section>

      <section className="stats-section">
        <h6 className="stats-title">Sanzioni per partita</h6>
        <p className="stats-caption">
          Numero di partite in base al totale di sanzioni comminate (ogni espulsione vale due ammonizioni).
        </p>
        {sanctions.length === 0 ? (
          <p className="text-muted small mb-0">Nessuna partita selezionata.</p>
        ) : (
          <BarChart
            data={sanctions.map((s) => ({ label: String(s.weightedSanctions), value: s.matches, display: String(s.matches) }))}
          />
        )}
        <p className="stats-note">Nota: ai fini della statistica, un cartellino rosso equivale a due cartellini gialli.</p>
      </section>

      <section className="stats-section">
        <h6 className="stats-title">Sanzioni per intervallo di 5 minuti</h6>
        <p className="stats-caption">
          Percentuale delle sanzioni comminate in ciascun intervallo di 5 minuti, su una linea temporale di 90 minuti.
        </p>
        {referti.length === 0 ? (
          <p className="text-muted small mb-0">Nessuna partita selezionata.</p>
        ) : (
          <BarChart
            data={intervals.map((i) => ({ label: i.label, value: i.percentage, display: pct(i.percentage) }))}
            format={(v) => pct(v)}
          />
        )}
      </section>

      <section className="stats-section">
        <h6 className="stats-title">Ammonizioni calciatori per motivo</h6>
        <p className="stats-caption">
          Percentuale delle ammonizioni comminate ai calciatori, raggruppate per motivo.
        </p>
        {micro.length === 0 ? (
          <p className="text-muted small mb-0">Nessun dato disponibile.</p>
        ) : (
          <BarChart
            horizontal
            data={micro.map((m) => ({ label: m.label, value: m.percentage, display: pct(m.percentage) }))}
            format={(v) => pct(v)}
          />
        )}
      </section>
    </div>
  )
}

export default Stats