import { useState } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './auth'
import Layout from './components/Layout'
import {
  CalendarPage,
  DashboardPage,
  LaboratoryPage,
  NotFoundPage,
  ReservationDetailPage,
  ReservationFormPage,
  ReservationCreatePage,
  ReservationsPage,
  RequestersPage,
} from './pages'
import { setApiSession } from './services/api'
import './App.css'

function App() {
  const [session, setSession] = useState(null)

  function authenticate(result) {
    setApiSession(result.token, () => {
      setApiSession('')
      setSession(null)
    })
    setSession(result.user)
  }

  function logout() {
    setApiSession('')
    setSession(null)
  }

  return (
    <HashRouter>
      {session ? (
        <Routes>
          <Route element={<Layout user={session} onLogout={logout} />}>
            <Route index element={<DashboardPage user={session} />} />
            <Route path="laboratorios" element={<LaboratoryPage user={session} />} />
            <Route path="reservas" element={<ReservationsPage user={session} />} />
            <Route path="reservas/nueva" element={<ReservationCreatePage user={session} />} />
            <Route path="reservas/:id/editar" element={session.role === 'admin' ? <ReservationFormPage user={session} /> : <Navigate to="/reservas" replace />} />
            <Route path="reservas/:id" element={<ReservationDetailPage user={session} />} />
            <Route path="solicitantes" element={<RequestersPage />} />
            <Route path="calendario" element={<CalendarPage />} />
            <Route path="404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Routes>
      ) : <LoginPage onAuthenticate={authenticate} />}
    </HashRouter>
  )
}

export default App
