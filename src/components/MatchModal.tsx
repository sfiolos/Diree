import { useState } from 'react'
import type { Referto } from '../types.ts'
import { deleteReferto } from '../api.ts'
import Modal from './Modal.tsx'
import Detail from './Detail.tsx'
import Form from './Form.tsx'

interface MatchModalProps {
  referto: Referto | undefined
  show: boolean
  onClose: () => void
  onChanged: () => void
}

function MatchModal({ referto, show, onClose, onChanged }: MatchModalProps) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  const close = () => {
    setEditing(false)
    setConfirming(false)
    setError('')
    onClose()
  }

  const handleDelete = async () => {
    if (!referto) return
    try {
      await deleteReferto(referto.id)
      onChanged()
      close()
    } catch {
      setError('Impossibile eliminare il referto.')
    }
  }

  if (editing && referto) {
    return (
      <Modal show={show} title="Modifica partita" size="lg" onClose={close}>
        <Form
          key={referto.id}
          refertoId={referto.id}
          onSaved={() => {
            onChanged()
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      </Modal>
    )
  }

  return (
    <Modal
      show={show}
      title="Dettaglio partita"
      size="lg"
      onClose={close}
      actions={
        referto ? (
          confirming ? (
            <>
              <button className="btn btn-sm btn-danger" onClick={() => void handleDelete()}>
                Conferma
              </button>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setConfirming(false)}>
                Annulla
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-sm btn-outline-danger" onClick={() => setConfirming(true)}>
                Elimina
              </button>
              <button className="btn btn-sm btn-primary" onClick={() => setEditing(true)}>
                Modifica
              </button>
            </>
          )
        ) : undefined
      }
    >
      <Detail referto={referto} />
      {error && <p className="text-danger mt-3 mb-0">{error}</p>}
    </Modal>
  )
}

export default MatchModal