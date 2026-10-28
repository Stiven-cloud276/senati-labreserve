import { useEffect, useState } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import {
  CalendarPage,
  DashboardPage,
  LaboratoryPage,
  NotFoundPage,
  ReservationDetailPage,
  ReservationFormPage,
  ReservationsPage,
  RequestersPage,
} from './pages'
import { setApiWriteKey } from './services/api'
import './App.css'

function App() {
  const [writeKey, setWriteKey] = useState('')
  useEffect(() => setApiWriteKey(writeKey), [writeKey])

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout writeKey={writeKey} onWriteKeyChange={setWriteKey} />}>
          <Route index element={<DashboardPage />} />
          <Route path="laboratorios" element={<LaboratoryPage />} />
          <Route path="reservas" element={<ReservationsPage />} />
          <Route path="reservas/nueva" element={<ReservationFormPage />} />
          <Route path="reservas/:id/editar" element={<ReservationFormPage />} />
          <Route path="reservas/:id" element={<ReservationDetailPage />} />
          <Route path="solicitantes" element={<RequestersPage />} />
          <Route path="calendario" element={<CalendarPage />} />
          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
