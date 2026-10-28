import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  CalendarDays,
  CalendarRange,
  ChevronRight,
  FlaskConical,
  Gauge,
  KeyRound,
  Menu,
  Plus,
  UsersRound,
  X,
} from 'lucide-react'

const navigation = [
  { to: '/', label: 'Panel principal', icon: Gauge, end: true },
  { to: '/laboratorios', label: 'Laboratorios', icon: FlaskConical },
  { to: '/reservas', label: 'Reservas', icon: CalendarDays },
  { to: '/calendario', label: 'Calendario', icon: CalendarRange },
  { to: '/solicitantes', label: 'Solicitantes', icon: UsersRound },
]

export default function Layout({ writeKey, onWriteKeyChange }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [draftKey, setDraftKey] = useState(writeKey)
  const [todayLabel] = useState(() => new Intl.DateTimeFormat('es-PE', { dateStyle: 'full', timeZone: 'America/Lima' }).format(new Date()))
  const location = useLocation()
  const pageName = navigation.find(({ to, end }) => (
    end ? location.pathname === to : location.pathname.startsWith(to)
  ))?.label || 'Página'

  function saveKey(event) {
    event.preventDefault()
    onWriteKeyChange(draftKey.trim())
    setModalOpen(false)
  }

  return (
    <div className="app-shell">
      {menuOpen && <button className="mobile-backdrop" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><FlaskConical size={21} strokeWidth={2.2} /></div>
          <div><div className="brand-name">LABRESERVE</div><div className="brand-subtitle">SENATI · CFP HUARAZ</div></div>
        </div>
        <div className="nav-caption">Espacio de trabajo</div>
        <nav className="nav-list" aria-label="Navegación principal">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
            </NavLink>
          ))}
          <NavLink to="/reservas/nueva" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
            <Plus size={17} strokeWidth={1.8} /><span>Nueva reserva</span>
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <strong>SENATI LABRESERVE</strong><br />
          Proyecto académico demostrativo.<br />
          No es un sistema institucional oficial.
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-left">
            <button type="button" className="mobile-menu" aria-label="Abrir navegación" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
            <span className="breadcrumb">Espacio de trabajo</span><ChevronRight size={13} color="#9aa5b7" />
            <span className="topbar-label">{pageName}</span>
          </div>
          <div className="topbar-right">
            <span className="today-label">{todayLabel}</span>
            <button type="button" className="access-button" onClick={() => { setDraftKey(writeKey); setModalOpen(true) }}>
              <KeyRound size={14} /> Acceso de escritura
            </button>
            <div className="user-avatar" aria-label="Proyecto SENATI">SL</div>
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setModalOpen(false)
        }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="access-title">
            <h2 id="access-title">Acceso de escritura</h2>
            <p>En producción, las operaciones de creación, edición y eliminación requieren la clave configurada en el servidor. Se conserva solo en memoria durante esta sesión.</p>
            <form onSubmit={saveKey}>
              <div className="form-field">
                <label htmlFor="write-key">Clave de acceso</label>
                <input id="write-key" type="password" autoComplete="off" value={draftKey} onChange={(event) => setDraftKey(event.target.value)} placeholder="Introduce la clave proporcionada por el administrador" />
              </div>
              <div className="form-actions">
                <button type="button" className="button button-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="button">Guardar en esta sesión</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
