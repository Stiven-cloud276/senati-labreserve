import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  CalendarDays,
  CalendarRange,
  ChevronRight,
  FlaskConical,
  Gauge,
  LogOut,
  Menu,
  UsersRound,
  X,
} from 'lucide-react'

const navigation = [
  { to: '/', label: 'Panel principal', icon: Gauge, end: true },
  { to: '/laboratorios', label: 'Laboratorios', icon: FlaskConical, end: true },
  { to: '/reservas', label: 'Reservas', icon: CalendarDays },
  { to: '/calendario', label: 'Calendario', icon: CalendarRange, end: true },
  { to: '/solicitantes', label: 'Solicitantes', icon: UsersRound, end: true },
]

const logo = `${import.meta.env.BASE_URL}senati-logo.png`

export default function Layout({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [todayLabel] = useState(() => new Intl.DateTimeFormat('es-PE', { dateStyle: 'full', timeZone: 'America/Lima' }).format(new Date()))
  const location = useLocation()
  const pageName = navigation.find(({ to, end }) => (
    end ? location.pathname === to : location.pathname.startsWith(to)
  ))?.label || 'Página'

  return (
    <div className="app-shell">
      {menuOpen && <button className="mobile-backdrop" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><img src={logo} alt="" /></div>
          <div><div className="brand-name">LABRESERVE</div><div className="brand-subtitle">SENATI · CFP HUARAZ</div></div>
        </div>
        <div className="nav-caption">Espacio de trabajo</div>
        <nav className="nav-list" aria-label="Navegación principal">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
            </NavLink>
          ))}
          {location.pathname.startsWith('/reservas') && (
            <div className="nav-submenu">
              <NavLink to="/reservas/nueva" className={({ isActive }) => `nav-sub-link ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                Nueva reserva
              </NavLink>
            </div>
          )}
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
            <button type="button" className="mobile-menu" aria-label={menuOpen ? 'Cerrar navegación' : 'Abrir navegación'} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
            <span className="breadcrumb">Espacio de trabajo</span><ChevronRight size={13} color="#9aa5b7" />
            <span className="topbar-label">{pageName}</span>
          </div>
          <div className="topbar-right">
            <span className="today-label">{todayLabel}</span>
            <div className="account-summary">
              <div className="user-avatar" aria-hidden="true">{user.nombres?.slice(0, 1)}{user.apellidos?.slice(0, 1)}</div>
              <span className="account-name">{user.nombres}</span>
              <span className={`role-pill ${user.role === 'admin' ? 'admin' : ''}`}>{user.role === 'admin' ? 'Administrador' : 'Usuario'}</span>
            </div>
            <button type="button" className="access-button" onClick={onLogout} aria-label="Cerrar sesión"><LogOut size={15} /> <span>Cerrar sesión</span></button>
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  )
}
