import type { Referto } from '../types.ts'
import Modal from './Modal.tsx'
import Stats from './Stats.tsx'

interface StatsModalProps {
  referti: Referto[]
  show: boolean
  onClose: () => void
}

function StatsModal({ referti, show, onClose }: StatsModalProps) {
  return (
    <Modal show={show} title="Statistiche" size="xl" onClose={onClose}>
      {referti.length === 0 ? (
        <p className="text-muted mb-0">Seleziona almeno una partita per visualizzare le statistiche.</p>
      ) : (
        <Stats referti={referti} />
      )}
    </Modal>
  )
}

export default StatsModal