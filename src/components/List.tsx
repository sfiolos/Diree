import { useMemo, useRef, useState } from 'react'
import type { Referto } from '../types.ts'
import { downloadBackup, restoreBackup } from '../api.ts'
import { downloadCsv } from '../lib/csv.ts'
import MatchModal from './MatchModal.tsx'
import StatsModal from './StatsModal.tsx'

interface ListProps {
  referti: Referto[]
  onChanged: () => void
}

type SortField = 'data' | 'created_at' | 'categoria'

function CategoriaFilter({
  options,
  selected,
  onChange,
}: {
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const [open, setOpen] = useState(false)

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((c) => c !== value) : [...selected, value])
  }

  return (
    <div className="categoria-filter">
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm w-100 d-flex justify-content-between align-items-center"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{selected.length === 0 ? 'Tutte le categorie' : `${selected.length} selezionata${selected.length > 1 ? 'e' : ''}`}</span>
        <span className="small">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          <div className="dropdown-backdrop" onClick={() => setOpen(false)} />
          <div className="categoria-menu">
            <div className="categoria-menu-item">
              <label className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={selected.length === options.length && options.length > 0}
                  onChange={(e) => onChange(e.target.checked ? [...options] : [])}
                />
                <span className="form-check-label">Seleziona tutte</span>
              </label>
            </div>
            {options.map((c) => (
              <div className="categoria-menu-item" key={c}>
                <label className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={selected.includes(c)}
                    onChange={() => toggle(c)}
                  />
                  <span className="form-check-label text-truncate">{c}</span>
                </label>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function List({ referti, onChanged }: ListProps) {
  const [fCategorie, setFCategorie] = useState<string[]>([])
  const [fSquadra, setFSquadra] = useState('')
  const [fFrom, setFFrom] = useState('')
  const [fTo, setFTo] = useState('')
  const [sort, setSort] = useState<SortField>('data')
  const [asc, setAsc] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detailId, setDetailId] = useState<string | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [dataMsg, setDataMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const backupInputRef = useRef<HTMLInputElement>(null)

  const categorie = useMemo(
    () => Array.from(new Set(referti.map((r) => r.categoria).filter(Boolean))).sort(),
    [referti],
  )

  const filtered = useMemo(() => {
    const squadra = fSquadra.trim().toLowerCase()
    const rows = referti.filter((r) => {
      if (fCategorie.length > 0 && !fCategorie.includes(r.categoria)) return false
      if (fFrom && r.data < fFrom) return false
      if (fTo && r.data > fTo) return false
      if (
        squadra &&
        !r.squadra_di_casa.toLowerCase().includes(squadra) &&
        !r.squadra_ospite.toLowerCase().includes(squadra)
      ) {
        return false
      }
      return true
    })
    const dir = asc ? 1 : -1
    return rows.sort((a, b) => {
      const av = a[sort] ?? ''
      const bv = b[sort] ?? ''
      return av < bv ? -1 * dir : av > bv ? 1 * dir : 0
    })
  }, [referti, fCategorie, fSquadra, fFrom, fTo, sort, asc])

  const detailReferto = detailId ? referti.find((r) => r.id === detailId) : undefined
  const selectedReferti = referti.filter((r) => selected.has(r.id))

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allVisibleSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id))

  const hasActiveFilters = fCategorie.length > 0 || fSquadra !== '' || fFrom !== '' || fTo !== ''

  const resetFilters = () => {
    setFCategorie([])
    setFSquadra('')
    setFFrom('')
    setFTo('')
  }

  const handleCsvExport = () => {
    const date = new Date().toISOString().slice(0, 10)
    downloadCsv(filtered, `diree-partite-${date}.csv`)
  }

  const handleBackupExport = async () => {
    setDataMsg(null)
    try {
      await downloadBackup()
      setDataMsg({ kind: 'success', text: 'Backup scaricato.' })
    } catch (e) {
      setDataMsg({ kind: 'error', text: e instanceof Error ? e.message : 'Errore durante il backup.' })
    }
  }

  const handleBackupFile = async (file: File) => {
    setDataMsg(null)
    if (!window.confirm('Il ripristino sovrascrive TUTTI i dati attuali con quelli del file di backup. Continuare?')) {
      return
    }
    try {
      const { restored } = await restoreBackup(file)
      setDataMsg({ kind: 'success', text: `Backup ripristinato: ${restored} referti.` })
      onChanged()
    } catch (e) {
      setDataMsg({ kind: 'error', text: e instanceof Error ? e.message : 'Errore durante il ripristino.' })
    }
  }

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        for (const r of filtered) next.delete(r.id)
      } else {
        for (const r of filtered) next.add(r.id)
      }
      return next
    })
  }

  return (
    <div>
      <div className="card mb-3">
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-sm-6 col-lg-3">
              <label className="form-label small mb-1">Categoria</label>
              <CategoriaFilter options={categorie} selected={fCategorie} onChange={setFCategorie} />
            </div>
            <div className="col-6 col-sm-4 col-lg-2">
              <label className="form-label small mb-1">Squadra</label>
              <input className="form-control form-control-sm" value={fSquadra} onChange={(e) => setFSquadra(e.target.value)} />
            </div>
            <div className="col-6 col-sm-4 col-lg-2">
              <label className="form-label small mb-1">Dal</label>
              <input
                className="form-control form-control-sm"
                type="date"
                value={fFrom}
                onChange={(e) => setFFrom(e.target.value)}
              />
            </div>
            <div className="col-6 col-sm-4 col-lg-2">
              <label className="form-label small mb-1">Al</label>
              <input
                className="form-control form-control-sm"
                type="date"
                value={fTo}
                onChange={(e) => setFTo(e.target.value)}
              />
            </div>
            <div className="col-6 col-sm-4 col-lg-2">
              <label className="form-label small mb-1">Ordina per</label>
              <select className="form-select form-select-sm" value={sort} onChange={(e) => setSort(e.target.value as SortField)}>
                <option value="data">Data</option>
                <option value="created_at">Inserimento</option>
                <option value="categoria">Categoria</option>
              </select>
            </div>
            <div className="col-6 col-sm-2 col-lg-1">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary w-100"
                title={asc ? 'Ordinamento crescente' : 'Ordinamento decrescente'}
                onClick={() => setAsc((v) => !v)}
              >
                {asc ? '↑' : '↓'}
              </button>
            </div>
          </div>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2">
            <div>
              {hasActiveFilters && (
                <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none text-secondary" onClick={resetFilters}>
                  Cancella filtri
                </button>
              )}
            </div>
            <div className="d-flex flex-wrap align-items-center gap-2">
              {dataMsg && (
                <span className={`small ${dataMsg.kind === 'success' ? 'text-success' : 'text-danger'}`}>{dataMsg.text}</span>
              )}
              <div className="btn-group" role="group" aria-label="Esporta e backup">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  title="Esporta le partite visualizzate in CSV"
                  onClick={handleCsvExport}
                  disabled={filtered.length === 0}
                >
                  Esporta CSV
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  title="Scarica un backup JSON di tutti i referti"
                  onClick={() => void handleBackupExport()}
                >
                  Backup JSON
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  title="Ripristina un backup JSON (sovrascrive i dati attuali)"
                  onClick={() => backupInputRef.current?.click()}
                >
                  Ripristina backup
                </button>
              </div>
              <input
                ref={backupInputRef}
                type="file"
                accept="application/json,.json"
                className="d-none"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void handleBackupFile(f)
                  if (backupInputRef.current) backupInputRef.current.value = ''
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted">Nessun referto.</p>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0 match-table">
              <thead>
                <tr>
                  <th className="col-select">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      aria-label="Seleziona tutte le partite visibili"
                    />
                  </th>
                  <th>Data</th>
                  <th>Partita</th>
                  <th>Risultato</th>
                  <th>Categoria</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className={selected.has(r.id) ? 'table-primary' : ''}
                    onClick={() => setDetailId(r.id)}
                  >
                    <td className="col-select" onClick={(e) => e.stopPropagation()}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleSelected(r.id)}
                        aria-label={`Seleziona ${r.squadra_di_casa} vs ${r.squadra_ospite}`}
                      />
                    </td>
                    <td>{r.data || '—'}</td>
                    <td>
                      {r.squadra_di_casa || '—'} vs {r.squadra_ospite || '—'}
                    </td>
                    <td>
                      {r.gol_casa} – {r.gol_ospite}
                    </td>
                    <td>{r.categoria || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="stats-fab">
        <span className="stats-fab-note text-muted small">
          {selectedReferti.length === 0 ? (
            'Seleziona una o più partite per calcolarne le statistiche'
          ) : (
            'Statistiche delle partite selezionate'
          )}
        </span>
        <button
          type="button"
          className="btn btn-primary rounded-circle stats-fab-btn"
          title="Mostra statistiche per le partite selezionate"
          disabled={selectedReferti.length === 0}
          onClick={() => setShowStats(true)}
        >
          Σ
        </button>
      </div>

      <MatchModal
        referto={detailReferto}
        show={detailId !== null}
        onClose={() => setDetailId(null)}
        onChanged={onChanged}
      />

      <StatsModal referti={selectedReferti} show={showStats} onClose={() => setShowStats(false)} />
    </div>
  )
}

export default List