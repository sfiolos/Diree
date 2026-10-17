import { useEffect, useState } from 'react'
import type { Goal, Referto, Sanzione, Sostituzione } from '../types.ts'
import { getReferto, updateReferto } from '../api.ts'

interface Draft {
  categoria: string
  girone: string
  stagione: string
  squadra_di_casa: string
  squadra_ospite: string
  data: string
  orario: string
  localita: string
  gol_casa: number
  gol_ospite: number
  rigori_casa: number | null
  rigori_ospite: number | null
  penalty_shootout: boolean
  recupero_1t: string
  recupero_2t: string
  goals: Goal[]
  sostituzioni: Sostituzione[]
  sanzioni: Sanzione[]
}

function emptyDraft(): Draft {
  return {
    categoria: '',
    girone: '',
    stagione: '',
    squadra_di_casa: '',
    squadra_ospite: '',
    data: '',
    orario: '',
    localita: '',
    gol_casa: 0,
    gol_ospite: 0,
    rigori_casa: null,
    rigori_ospite: null,
    penalty_shootout: false,
    recupero_1t: '',
    recupero_2t: '',
    goals: [],
    sostituzioni: [],
    sanzioni: [],
  }
}

function emptyGoal(): Goal {
  return { nome_squadra: '', squadra_casa: true, tempo: '1T', minuto: '', rigore: false }
}

function emptySostituzione(): Sostituzione {
  return {
    nome_squadra: '',
    squadra_casa: true,
    tempo: '1T',
    minuto: '',
    esce_numero: '',
    entra_numero: '',
    esce_nome: '',
    entra_nome: '',
  }
}

function emptySanzione(): Sanzione {
  return {
    ammonizione: true,
    nome_: '',
    numero: '',
    motivo_macro: '',
    motivo_micro: '',
    nome_squadra: '',
    squadra_casa: true,
    tempo: '1T',
    minuto: '',
    tipo_soggetto: 'giocatore',
  }
}

function toDraft(r: Referto): Draft {
  return {
    categoria: r.categoria,
    girone: r.girone,
    stagione: r.stagione,
    squadra_di_casa: r.squadra_di_casa,
    squadra_ospite: r.squadra_ospite,
    data: r.data,
    orario: r.orario,
    localita: r.localita,
    gol_casa: r.gol_casa,
    gol_ospite: r.gol_ospite,
    rigori_casa: r.rigori_casa,
    rigori_ospite: r.rigori_ospite,
    penalty_shootout: r.penalty_shootout,
    recupero_1t: r.recupero_1t,
    recupero_2t: r.recupero_2t,
    goals: r.goals,
    sostituzioni: r.sostituzioni,
    sanzioni: r.sanzioni,
  }
}

interface FormProps {
  refertoId: string
  onSaved: () => void
  onCancel: () => void
}

function Form({ refertoId, onSaved, onCancel }: FormProps) {
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [busy, setBusy] = useState<boolean>(false)

  useEffect(() => {
    let active = true
    getReferto(refertoId)
      .then((r) => {
        if (active) setDraft(toDraft(r))
      })
      .catch(() => {
        if (active) setError('Impossibile caricare il referto.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [refertoId])

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  const handleSubmit = async () => {
    setBusy(true)
    setError('')
    try {
      const payload = {
        ...draft,
        rigori_casa: draft.penalty_shootout ? draft.rigori_casa : null,
        rigori_ospite: draft.penalty_shootout ? draft.rigori_ospite : null,
      }
      await updateReferto(refertoId, payload)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore nel salvataggio.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {loading ? (
        <p className="text-muted mb-0">Caricamento…</p>
      ) : (
        <>
          <section className="form-section">
            <h6 className="form-section-title">Partita</h6>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Categoria</label>
                <input className="form-control" value={draft.categoria} onChange={(e) => set('categoria', e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Girone</label>
                <input className="form-control" value={draft.girone} onChange={(e) => set('girone', e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Stagione</label>
                <input
                  className="form-control"
                  value={draft.stagione}
                  placeholder="2024/2025"
                  onChange={(e) => set('stagione', e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Squadra di casa</label>
                <input className="form-control" value={draft.squadra_di_casa} onChange={(e) => set('squadra_di_casa', e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Squadra ospite</label>
                <input className="form-control" value={draft.squadra_ospite} onChange={(e) => set('squadra_ospite', e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Data</label>
                <input className="form-control" type="date" value={draft.data} onChange={(e) => set('data', e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Orario</label>
                <input className="form-control" type="time" value={draft.orario} onChange={(e) => set('orario', e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Località</label>
                <input className="form-control" value={draft.localita} onChange={(e) => set('localita', e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Gol casa</label>
                <input
                  className="form-control"
                  type="number"
                  min={0}
                  value={draft.gol_casa}
                  onChange={(e) => set('gol_casa', Number(e.target.value))}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Gol ospite</label>
                <input
                  className="form-control"
                  type="number"
                  min={0}
                  value={draft.gol_ospite}
                  onChange={(e) => set('gol_ospite', Number(e.target.value))}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Recupero 1°T</label>
                <input className="form-control" value={draft.recupero_1t} placeholder="2'" onChange={(e) => set('recupero_1t', e.target.value)} />
              </div>
              <div className="col-md-2">
                <label className="form-label">Recupero 2°T</label>
                <input className="form-control" value={draft.recupero_2t} placeholder="4'" onChange={(e) => set('recupero_2t', e.target.value)} />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h6 className="form-section-title">Rigori / supplementari</h6>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="penalty-shootout"
                checked={draft.penalty_shootout}
                onChange={(e) => set('penalty_shootout', e.target.checked)}
              />
              <label className="form-check-label" htmlFor="penalty-shootout">
                Ai rigori
              </label>
            </div>
            {draft.penalty_shootout && (
              <div className="row g-3 mt-1">
                <div className="col-md-6">
                  <label className="form-label">Rigori casa</label>
                  <input
                    className="form-control"
                    type="number"
                    min={0}
                    value={draft.rigori_casa ?? ''}
                    onChange={(e) => set('rigori_casa', e.target.value === '' ? null : Number(e.target.value))}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Rigori ospite</label>
                  <input
                    className="form-control"
                    type="number"
                    min={0}
                    value={draft.rigori_ospite ?? ''}
                    onChange={(e) => set('rigori_ospite', e.target.value === '' ? null : Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </section>

          <section className="form-section">
            <h6 className="form-section-title">Goal</h6>
            {draft.goals.map((g, i) => (
              <GoalRow
                key={i}
                goal={g}
                onChange={(ng) => set('goals', draft.goals.map((x, j) => (j === i ? ng : x)))}
                onRemove={() => set('goals', draft.goals.filter((_, j) => j !== i))}
              />
            ))}
            <button
              className="btn btn-outline-primary btn-sm"
              type="button"
              onClick={() => set('goals', [...draft.goals, emptyGoal()])}
            >
              + Aggiungi goal
            </button>
          </section>

          <section className="form-section">
            <h6 className="form-section-title">Sostituzioni</h6>
            {draft.sostituzioni.map((s, i) => (
              <SubRow
                key={i}
                sub={s}
                onChange={(ns) => set('sostituzioni', draft.sostituzioni.map((x, j) => (j === i ? ns : x)))}
                onRemove={() => set('sostituzioni', draft.sostituzioni.filter((_, j) => j !== i))}
              />
            ))}
            <button
              className="btn btn-outline-primary btn-sm"
              type="button"
              onClick={() => set('sostituzioni', [...draft.sostituzioni, emptySostituzione()])}
            >
              + Aggiungi sostituzione
            </button>
          </section>

          <section className="form-section">
            <h6 className="form-section-title">Sanzioni</h6>
            {draft.sanzioni.map((s, i) => (
              <SanRow
                key={i}
                san={s}
                onChange={(ns) => set('sanzioni', draft.sanzioni.map((x, j) => (j === i ? ns : x)))}
                onRemove={() => set('sanzioni', draft.sanzioni.filter((_, j) => j !== i))}
              />
            ))}
            <button
              className="btn btn-outline-primary btn-sm"
              type="button"
              onClick={() => set('sanzioni', [...draft.sanzioni, emptySanzione()])}
            >
              + Aggiungi sanzione
            </button>
          </section>

          {error && <p className="text-danger mt-3 mb-0">{error}</p>}

          <div className="d-flex gap-2 justify-content-end mt-4">
            <button className="btn btn-primary" onClick={() => void handleSubmit()} disabled={busy}>
              {busy ? 'Salvataggio…' : 'Salva modifiche'}
            </button>
            <button className="btn btn-outline-secondary" onClick={onCancel}>
              Annulla
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function TempoSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="form-select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="1T">1°T</option>
      <option value="2T">2°T</option>
    </select>
  )
}

function SquadraToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <select className="form-select" value={value ? 'casa' : 'ospite'} onChange={(e) => onChange(e.target.value === 'casa')}>
      <option value="casa">Casa</option>
      <option value="ospite">Ospite</option>
    </select>
  )
}

interface GoalRowProps {
  goal: Goal
  onChange: (g: Goal) => void
  onRemove: () => void
}

function GoalRow({ goal, onChange, onRemove }: GoalRowProps) {
  return (
    <div className="form-item mb-3">
      <div className="row g-3">
        <div className="col-md-3">
          <label className="form-label">Squadra</label>
          <input className="form-control" value={goal.nome_squadra} onChange={(e) => onChange({ ...goal, nome_squadra: e.target.value })} />
        </div>
        <div className="col-md-2">
          <label className="form-label">Campo</label>
          <SquadraToggle value={goal.squadra_casa} onChange={(v) => onChange({ ...goal, squadra_casa: v })} />
        </div>
        <div className="col-md-2">
          <label className="form-label">Tempo</label>
          <TempoSelect value={goal.tempo} onChange={(v) => onChange({ ...goal, tempo: v })} />
        </div>
        <div className="col-md-2">
          <label className="form-label">Minuto</label>
          <input className="form-control" value={goal.minuto} onChange={(e) => onChange({ ...goal, minuto: e.target.value })} />
        </div>
        <div className="col-md-2 d-flex align-items-end">
          <div className="form-check mb-1">
            <input
              className="form-check-input"
              type="checkbox"
              id={`rigore-${goal.nome_squadra}-${goal.minuto}`}
              checked={goal.rigore}
              onChange={(e) => onChange({ ...goal, rigore: e.target.checked })}
            />
            <label className="form-check-label" htmlFor={`rigore-${goal.nome_squadra}-${goal.minuto}`}>
              Rigore
            </label>
          </div>
        </div>
        <div className="col-md-1 d-flex align-items-end justify-content-end">
          <button className="btn btn-sm btn-outline-secondary" type="button" onClick={onRemove} aria-label="Rimuovi">
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

interface SubRowProps {
  sub: Sostituzione
  onChange: (s: Sostituzione) => void
  onRemove: () => void
}

function SubRow({ sub, onChange, onRemove }: SubRowProps) {
  return (
    <div className="form-item mb-3">
      <div className="row g-3">
        <div className="col-md-3">
          <label className="form-label">Squadra</label>
          <input className="form-control" value={sub.nome_squadra} onChange={(e) => onChange({ ...sub, nome_squadra: e.target.value })} />
        </div>
        <div className="col-md-2">
          <label className="form-label">Campo</label>
          <SquadraToggle value={sub.squadra_casa} onChange={(v) => onChange({ ...sub, squadra_casa: v })} />
        </div>
        <div className="col-md-2">
          <label className="form-label">Tempo</label>
          <TempoSelect value={sub.tempo} onChange={(v) => onChange({ ...sub, tempo: v })} />
        </div>
        <div className="col-md-2">
          <label className="form-label">Minuto</label>
          <input className="form-control" value={sub.minuto} onChange={(e) => onChange({ ...sub, minuto: e.target.value })} />
        </div>
        <div className="col-md-3 d-flex align-items-end justify-content-end">
          <button className="btn btn-sm btn-outline-secondary" type="button" onClick={onRemove} aria-label="Rimuovi">
            ✕
          </button>
        </div>
      </div>
      <div className="row g-3 mt-1">
        <div className="col-md-3">
          <label className="form-label">Esce n°</label>
          <input className="form-control" value={sub.esce_numero} onChange={(e) => onChange({ ...sub, esce_numero: e.target.value })} />
        </div>
        <div className="col-md-3">
          <label className="form-label">Esce nome</label>
          <input className="form-control" value={sub.esce_nome} onChange={(e) => onChange({ ...sub, esce_nome: e.target.value })} />
        </div>
        <div className="col-md-3">
          <label className="form-label">Entra n°</label>
          <input className="form-control" value={sub.entra_numero} onChange={(e) => onChange({ ...sub, entra_numero: e.target.value })} />
        </div>
        <div className="col-md-3">
          <label className="form-label">Entra nome</label>
          <input className="form-control" value={sub.entra_nome} onChange={(e) => onChange({ ...sub, entra_nome: e.target.value })} />
        </div>
      </div>
    </div>
  )
}

interface SanRowProps {
  san: Sanzione
  onChange: (s: Sanzione) => void
  onRemove: () => void
}

function SanRow({ san, onChange, onRemove }: SanRowProps) {
  return (
    <div className="form-item mb-3">
      <div className="row g-3">
        <div className="col-md-2 d-flex align-items-end">
          <div className="form-check mb-1">
            <input
              className="form-check-input"
              type="checkbox"
              id={`ammonizione-${san.nome_}-${san.minuto}`}
              checked={san.ammonizione}
              onChange={(e) => onChange({ ...san, ammonizione: e.target.checked })}
            />
            <label className="form-check-label" htmlFor={`ammonizione-${san.nome_}-${san.minuto}`}>
              Ammonizione
            </label>
          </div>
        </div>
        <div className="col-md-3">
          <label className="form-label">Nome</label>
          <input className="form-control" value={san.nome_} onChange={(e) => onChange({ ...san, nome_: e.target.value })} />
        </div>
        <div className="col-md-2">
          <label className="form-label">Numero</label>
          <input className="form-control" value={san.numero} onChange={(e) => onChange({ ...san, numero: e.target.value })} />
        </div>
        <div className="col-md-3">
          <label className="form-label">Soggetto</label>
          <select className="form-select" value={san.tipo_soggetto} onChange={(e) => onChange({ ...san, tipo_soggetto: e.target.value })}>
            <option value="giocatore">Giocatore</option>
            <option value="allenatore">Allenatore</option>
            <option value="dirigente">Dirigente</option>
          </select>
        </div>
        <div className="col-md-2 d-flex align-items-end justify-content-end">
          <button className="btn btn-sm btn-outline-secondary" type="button" onClick={onRemove} aria-label="Rimuovi">
            ✕
          </button>
        </div>
      </div>
      <div className="row g-3 mt-1">
        <div className="col-md-3">
          <label className="form-label">Squadra</label>
          <input className="form-control" value={san.nome_squadra} onChange={(e) => onChange({ ...san, nome_squadra: e.target.value })} />
        </div>
        <div className="col-md-2">
          <label className="form-label">Campo</label>
          <SquadraToggle value={san.squadra_casa} onChange={(v) => onChange({ ...san, squadra_casa: v })} />
        </div>
        <div className="col-md-2">
          <label className="form-label">Tempo</label>
          <TempoSelect value={san.tempo} onChange={(v) => onChange({ ...san, tempo: v })} />
        </div>
        <div className="col-md-2">
          <label className="form-label">Minuto</label>
          <input className="form-control" value={san.minuto} onChange={(e) => onChange({ ...san, minuto: e.target.value })} />
        </div>
        <div className="col-md-3">
          <label className="form-label">Motivo (micro)</label>
          <input className="form-control" value={san.motivo_micro} onChange={(e) => onChange({ ...san, motivo_micro: e.target.value })} />
        </div>
      </div>
      <div className="row g-3 mt-1">
        <div className="col-12">
          <label className="form-label">Motivo (macro)</label>
          <input className="form-control" value={san.motivo_macro} onChange={(e) => onChange({ ...san, motivo_macro: e.target.value })} />
        </div>
      </div>
    </div>
  )
}

export default Form