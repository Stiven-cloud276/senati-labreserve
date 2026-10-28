import { AlertCircle, LoaderCircle, Search } from 'lucide-react'

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
