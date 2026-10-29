import { useEffect, useId } from 'react'
import { AlertCircle, LoaderCircle, Search, X } from 'lucide-react'

export function Modal({ title, onClose, children, size = 'normal' }) {
  const titleId = useId()
  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className={`modal ${size === 'wide' ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-heading"><h2 id={titleId}>{title}</h2><button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar ventana"><X size={16} /></button></div>
        {children}
      </section>
    </div>
  )
}

export function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export function LoadingState({ label = 'Cargando información...' }) {
  return <div className="loading-state"><LoaderCircle size={22} /><span>{label}</span></div>
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={24} />
      <strong>No se pudo cargar la información</strong>
      <p>{error}</p>
      {onRetry && <button className="button button-secondary" type="button" onClick={onRetry}>Intentar nuevamente</button>}
    </div>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <Search size={22} />
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  )
}

export function StatusBadge({ status }) {
  return <span className={`status status-${status}`}>{status === 'confirmada' ? '● ' : ''}{status?.charAt(0).toUpperCase()}{status?.slice(1)}</span>
}

export function Toast({ message, error = false }) {
  if (!message) return null
  return <div role={error ? 'alert' : 'status'} className={`toast ${error ? 'error' : ''}`}>{message}</div>
}
