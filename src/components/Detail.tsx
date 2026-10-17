import type { Referto } from '../types.ts'

interface DetailProps {
  referto: Referto | undefined
}

function Detail({ referto }: DetailProps) {
  if (!referto) {
    return <p className="text-muted mb-0">Referto non trovato.</p>
  }

  const meta = [referto.data, referto.orario, referto.localita].filter(Boolean).join(' · ')

  return (
    <div>
      <div className="detail-scoreboard card mb-4">
        <div className="card-body py-4">
          <div className="detail-teams">
            <div className="detail-team">
              <div className="detail-team-name">{referto.squadra_di_casa || '—'}</div>
              <div className="detail-team-score">{referto.gol_casa}</div>
            </div>
            <div className="detail-vs">
              <div className="detail-vs-mark">VS</div>
              {referto.penalty_shootout && (
                <div className="detail-pens">
                  rig. {referto.rigori_casa ?? 0} – {referto.rigori_ospite ?? 0}
                </div>
              )}
            </div>
            <div className="detail-team">
              <div className="detail-team-name">{referto.squadra_ospite || '—'}</div>
              <div className="detail-team-score">{referto.gol_ospite}</div>
            </div>
          </div>
          {meta && <div className="detail-meta text-muted text-center small mt-3">{meta}</div>}
        </div>
      </div>

      <div className="detail-info-grid mb-4">
        <div className="detail-info-item">
          <div className="detail-info-label">Categoria</div>
          <div className="detail-info-value">
            {referto.categoria || '—'}
            {referto.girone && <span className="text-muted"> · Girone {referto.girone}</span>}
          </div>
        </div>
        <div className="detail-info-item">
          <div className="detail-info-label">Stagione</div>
          <div className="detail-info-value">{referto.stagione || '—'}</div>
        </div>
        <div className="detail-info-item">
          <div className="detail-info-label">Recupero 1°T</div>
          <div className="detail-info-value">{referto.recupero_1t || '—'}</div>
        </div>
        <div className="detail-info-item">
          <div className="detail-info-label">Recupero 2°T</div>
          <div className="detail-info-value">{referto.recupero_2t || '—'}</div>
        </div>
      </div>

      <section className="detail-section">
        <h6 className="detail-section-title">Goal</h6>
        {referto.goals.length === 0 ? (
          <p className="text-muted small mb-0">Nessun marcatore.</p>
        ) : (
          <div className="table-responsive">
            <table className="table detail-table">
              <thead>
                <tr>
                  <th>Squadra</th>
                  <th>Campo</th>
                  <th>Tempo</th>
                  <th>Minuto</th>
                  <th>Rigore</th>
                </tr>
              </thead>
              <tbody>
                {referto.goals.map((g, i) => (
                  <tr key={i}>
                    <td>{g.nome_squadra}</td>
                    <td>{g.squadra_casa ? 'Casa' : 'Ospite'}</td>
                    <td>{g.tempo}</td>
                    <td>{g.minuto}</td>
                    <td>{g.rigore ? 'Sì' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="detail-section">
        <h6 className="detail-section-title">Sostituzioni</h6>
        {referto.sostituzioni.length === 0 ? (
          <p className="text-muted small mb-0">Nessuna sostituzione.</p>
        ) : (
          <div className="table-responsive">
            <table className="table detail-table">
              <thead>
                <tr>
                  <th>Squadra</th>
                  <th>Tempo</th>
                  <th>Minuto</th>
                  <th>Esce</th>
                  <th>Entra</th>
                </tr>
              </thead>
              <tbody>
                {referto.sostituzioni.map((s, i) => (
                  <tr key={i}>
                    <td>{s.nome_squadra}</td>
                    <td>{s.tempo}</td>
                    <td>{s.minuto}</td>
                    <td>
                      {s.esce_numero} {s.esce_nome}
                    </td>
                    <td>
                      {s.entra_numero} {s.entra_nome}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="detail-section">
        <h6 className="detail-section-title">Sanzioni</h6>
        {referto.sanzioni.length === 0 ? (
          <p className="text-muted small mb-0">Nessuna sanzione.</p>
        ) : (
          <div className="table-responsive">
            <table className="table detail-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Nome</th>
                  <th>Squadra</th>
                  <th>Campo</th>
                  <th>Tempo</th>
                  <th>Minuto</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {referto.sanzioni.map((s, i) => (
                  <tr key={i}>
                    <td>{s.ammonizione ? 'Ammonizione' : 'Espulsione'}</td>
                    <td>
                      {s.numero} {s.nome_}
                    </td>
                    <td>{s.nome_squadra}</td>
                    <td>{s.squadra_casa ? 'Casa' : 'Ospite'}</td>
                    <td>{s.tempo}</td>
                    <td>{s.minuto}</td>
                    <td>
                      {s.motivo_macro}
                      {s.motivo_micro && ` — ${s.motivo_micro}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default Detail