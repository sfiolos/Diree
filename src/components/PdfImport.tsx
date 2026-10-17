import { useRef, useState } from 'react'
import { scrapePdfBatch } from '../api.ts'
import type { BatchItem } from '../api.ts'

interface PdfImportProps {
  onImported: () => void
}

interface PoolItem {
  key: string
  file: File
}

function statusLabel(item: BatchItem): string {
  switch (item.status) {
    case 'created':
      return 'Importata con successo'
    case 'duplicate':
      return 'Già presente (duplicato)'
    default:
      return `Impossibile leggere il PDF${item.error ? ` — ${item.error}` : ''}`
  }
}

function PdfImport({ onImported }: PdfImportProps) {
  const [pool, setPool] = useState<PoolItem[]>([])
  const [results, setResults] = useState<BatchItem[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (files: FileList | null) => {
    const list = Array.from(files ?? [])
    if (list.length === 0) return
    setPool((prev) => {
      const existing = new Set(prev.map((p) => p.file.name))
      const fresh = list
        .filter((f) => !existing.has(f.name))
        .map((f) => ({ key: `${f.name}-${f.lastModified}`, file: f }))
      return [...prev, ...fresh]
    })
    if (inputRef.current) inputRef.current.value = ''
  }

  const removeFromPool = (key: string) => {
    setPool((prev) => prev.filter((p) => p.key !== key))
  }

  const clearResults = () => {
    setResults([])
    setError('')
  }

  const handleProcess = async () => {
    if (pool.length === 0 || busy) return
    const files = pool.map((p) => p.file)
    setBusy(true)
    setError('')
    setResults([])
    try {
      const data = await scrapePdfBatch(files)
      setResults(data.results)
      setPool([])
      if (data.results.some((r) => r.status === 'created')) onImported()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore durante l\'importazione.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="row g-4">
      <div className="col-lg-6">
        <div className="card h-100">
          <div className="card-body p-4">
            <h5 className="card-title mb-3">PDF selezionati</h5>
            <p className="card-text text-muted small mb-4">
              Carica uno o più referti in formato PDF generati automaticamente da Sinfonia4you. I file vengono
              aggiunti alla coda e non elaborati finché non premi «Elabora».
            </p>

            <input
              type="file"
              className="form-control mb-4"
              accept="application/pdf"
              multiple
              ref={inputRef}
              disabled={busy}
              onChange={(e) => addFiles(e.target.files)}
            />

            {pool.length === 0 ? (
              <p className="text-muted mb-4">Nessun PDF in coda.</p>
            ) : (
              <ul className="list-group mb-4">
                {pool.map((p) => (
                  <li key={p.key} className="list-group-item d-flex align-items-center gap-2 py-3">
                    <span className="text-truncate">{p.file.name}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary ms-auto"
                      onClick={() => removeFromPool(p.key)}
                      disabled={busy}
                    >
                      Rimuovi
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void handleProcess()}
              disabled={pool.length === 0 || busy}
            >
              {busy ? 'Elaborazione in corso…' : `Elabora ${pool.length > 0 ? `(${pool.length})` : ''}`}
            </button>
            {error && <p className="text-danger mt-2 mb-0">{error}</p>}
          </div>
        </div>
      </div>

      <div className="col-lg-6">
        <div className="card h-100">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="card-title mb-0">Risultati</h5>
              {results.length > 0 && (
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={clearResults}>
                  Svuota
                </button>
              )}
            </div>
            {busy && <p className="text-muted mb-0">Elaborazione in corso…</p>}
            {!busy && results.length === 0 && (
              <p className="text-muted mb-0">Nessun risultato. Premi «Elabora» per processare i PDF in coda.</p>
            )}
            {!busy && results.length > 0 && (
              <ul className="list-group">
                {results.map((r) => (
                  <li key={r.filename} className="list-group-item py-3">
                    <div className="fw-semibold text-truncate">{r.filename}</div>
                    <div
                      className={`small ${
                        r.status === 'created' ? 'text-success' : r.status === 'duplicate' ? 'text-warning' : 'text-danger'
                      }`}
                    >
                      {statusLabel(r)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PdfImport