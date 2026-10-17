import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  show: boolean
  title?: string
  size?: 'lg' | 'xl'
  onClose: () => void
  actions?: ReactNode
  children: ReactNode
}

function Modal({ show, title, size, onClose, actions, children }: ModalProps) {
  useEffect(() => {
    if (!show) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [show, onClose])

  if (!show) return null

  const dialogClass = `modal-dialog modal-dialog-scrollable ${size === 'lg' ? 'modal-lg' : size === 'xl' ? 'modal-xl' : ''}`

  return (
    <div className="modal show d-block" tabIndex={-1} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={dialogClass} onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            {title && <h5 className="modal-title">{title}</h5>}
            <div className="d-flex align-items-center gap-2 ms-auto">
              {actions}
              <button type="button" className="btn-close ms-1" aria-label="Chiudi" onClick={onClose} />
            </div>
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default Modal