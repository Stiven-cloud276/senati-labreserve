import { useCallback, useEffect, useState } from 'react'
import { ErrorMessage, Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FlaskConical,
  Pencil,
  Plus,
  Search,
  Trash2,
  UsersRound,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from './services/api'
import { errorMessage, formatDate, shiftLocalDate, statusLabel, todayLocal } from './utils/format'
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge, Toast } from './components/Common'

function useResource(loader, dependencies = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await loader())
    } catch (loadError) {
      setError(errorMessage(loadError))
    } finally {
      setLoading(false)
    }
  // The caller supplies stable loaders and explicit dependencies.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  useEffect(() => { reload() }, [reload])
  return { data, error, loading, reload, setData }
}

const reservationSchema = Yup.object({
  laboratorio_id: Yup.number().typeError('Selecciona un laboratorio válido.').integer().positive('Selecciona un laboratorio válido.').required('Selecciona un laboratorio.'),
  solicitante_id: Yup.number().typeError('Selecciona un solicitante válido.').integer().positive('Selecciona un solicitante válido.').required('Selecciona un solicitante.'),
  fecha: Yup.string().required('Selecciona la fecha.').test('valid-date', 'La fecha no es válida.', (value) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return !value
    const [year, month, day] = value.split('-').map(Number)
    if (year < 1000) return false
    const date = new Date(Date.UTC(year, month - 1, day))
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  }),
  hora_inicio: Yup.string().required('Indica la hora de inicio.'),
  hora_fin: Yup.string().required('Indica la hora de finalización.').test('after-start', 'La hora final debe ser posterior a la inicial.', function (value) {
    return !value || !this.parent.hora_inicio || value > this.parent.hora_inicio
  }),
  motivo: Yup.string().trim().min(4, 'Escribe al menos 4 caracteres.').max(180, 'Máximo 180 caracteres.').required('Indica el motivo.'),
  estado: Yup.string().oneOf(['pendiente', 'confirmada', 'cancelada']).required('Selecciona el estado.'),
  observaciones: Yup.string().max(500, 'Máximo 500 caracteres.'),
})

const requesterSchema = Yup.object({
  nombres: Yup.string().trim().min(2, 'Escribe al menos 2 caracteres.').max(80, 'Máximo 80 caracteres.').required('Ingresa los nombres.'),
  apellidos: Yup.string().trim().min(2, 'Escribe al menos 2 caracteres.').max(80, 'Máximo 80 caracteres.').required('Ingresa los apellidos.'),
  correo: Yup.string().email('Ingresa un correo válido.').max(160, 'Máximo 160 caracteres.').required('Ingresa el correo.'),
  tipo_solicitante: Yup.string().oneOf(['instructor', 'personal', 'otro']).required('Selecciona el tipo.'),
})

function FormField({ name, label, as, children, full = false, ...props }) {
  return (
    <div className={`form-field ${full ? 'full' : ''}`}>
      <label htmlFor={name}>{label}</label>
      <Field id={name} name={name} as={as} {...props}>{children}</Field>
      <ErrorMessage name={name} component="span" className="field-error" />
    </div>
  )
}

function ReservationRows({ reservations, onDelete }) {
  if (!reservations.length) return (
    <EmptyState title="No hay reservas que mostrar" description="Crea una reserva o ajusta los filtros para consultar los registros." action={<Link className="button" to="/reservas/nueva"><Plus size={14} /> Nueva reserva</Link>} />
  )
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead><tr><th>Reserva</th><th>Laboratorio</th><th>Solicitante</th><th>Fecha y horario</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          {reservations.map((item) => (
            <tr key={item.id}>
              <td><span className="table-main">LR-{String(item.id).padStart(4, '0')}</span><span className="table-sub">{item.motivo}</span></td>
              <td><span className="table-main">{item.laboratorio_codigo}</span><span className="table-sub">{item.laboratorio_nombre}</span></td>
              <td>{item.solicitante_nombre}</td>
              <td>{formatDate(item.fecha)}<span className="table-sub">{String(item.hora_inicio).slice(0, 5)} – {String(item.hora_fin).slice(0, 5)}</span></td>
              <td><StatusBadge status={item.estado} /></td>
              <td><div className="table-actions">
                <Link className="icon-button" to={`/reservas/${item.id}`} aria-label={`Ver reserva ${item.id}`}><Eye size={14} /></Link>
                <Link className="icon-button" to={`/reservas/${item.id}/editar`} aria-label={`Editar reserva ${item.id}`}><Pencil size={14} /></Link>
                <button className="icon-button delete" type="button" onClick={() => onDelete(item)} aria-label={`Eliminar reserva ${item.id}`}><Trash2 size={14} /></button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DashboardPage() {
  const { data, error, loading, reload } = useResource(() => api.dashboard())
  if (loading) return <LoadingState />
  if (error) return <><PageHeader eyebrow="Vista general" title="Panel principal" description="Resumen actualizado de la gestión de laboratorios." /><ErrorState error={error} onRetry={reload} /></>
  const stats = [
    { label: 'Laboratorios activos', value: data.stats.laboratorios, note: 'Espacios disponibles en el sistema', icon: FlaskConical, color: '' },
    { label: 'Reservas de hoy', value: data.stats.hoy, note: 'Solicitudes para la fecha actual', icon: CalendarDays, color: 'cyan' },
    { label: 'Pendientes', value: data.stats.pendientes, note: 'Por revisar o confirmar', icon: Clock3, color: 'amber' },
    { label: 'Confirmadas', value: data.stats.confirmadas, note: 'Reservas vigentes', icon: CheckCircle2, color: 'green' },
  ]
  return (
    <>
      <section className="dashboard-hero">
        <div className="hero-copy">
          <div className="hero-tag"><span>✦</span> Gestión inteligente de espacios</div>
          <h1>Hola, bienvenido a LABRESERVE</h1>
          <p>Organiza el uso de los laboratorios del SENATI CFP Huaraz. Revisa disponibilidad y administra tus solicitudes desde un solo lugar.</p>
        </div>
        <Link className="button button-hero hero-action" to="/reservas/nueva"><Plus size={15} /> Crear una reserva</Link>
      </section>
      <section className="stats-grid" aria-label="Indicadores">
        {stats.map(({ label, value, note, icon: Icon, color }) => <article className="stat-card" key={label}>
          <div className="stat-top"><span>{label}</span><span className={`stat-icon ${color}`}><Icon size={15} /></span></div>
          <strong className="stat-value">{value}</strong><span className="stat-note">{note}</span>
        </article>)}
      </section>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading"><h2>Próximas reservas</h2><Link to="/reservas">Ver todas <ArrowRight size={12} /></Link></div>
          {data.proximas.length ? <div className="reservation-list">{data.proximas.map((item) => <Link className="reservation-row" to={`/reservas/${item.id}`} key={item.id}>
            <span><strong>{item.laboratorio_nombre}</strong><small>{item.solicitante_nombre} · {formatDate(item.fecha)}</small></span>
            <span className="reservation-row-time">{String(item.hora_inicio).slice(0, 5)}<small><StatusBadge status={item.estado} /></small></span>
          </Link>)}</div> : <EmptyState title="Agenda despejada" description="Todavía no hay reservas próximas registradas." action={<Link className="button button-secondary" to="/reservas/nueva">Crear primera reserva</Link>} />}
        </section>
        <section className="panel">
          <div className="panel-heading"><h2>Accesos rápidos</h2></div>
          <div className="quick-links">
            <Link className="quick-link" to="/laboratorios"><span className="quick-link-icon"><FlaskConical size={16} /></span><span><strong>Explorar laboratorios</strong><small>Consulta espacios y equipamiento</small></span></Link>
            <Link className="quick-link" to="/calendario"><span className="quick-link-icon"><CalendarDays size={16} /></span><span><strong>Ver calendario</strong><small>Revisa la disponibilidad por fecha</small></span></Link>
            <Link className="quick-link" to="/solicitantes"><span className="quick-link-icon"><UsersRound size={16} /></span><span><strong>Solicitantes</strong><small>Gestiona las personas registradas</small></span></Link>
          </div>
        </section>
      </div>
      <div className="academic-note">Proyecto académico demostrativo · SENATI — CFP Huaraz · No representa un sistema institucional oficial.</div>
    </>
  )
}

export function ReservationsPage() {
  const { data, error, loading, reload } = useResource(() => api.reservations())
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [toast, setToast] = useState('')
  const [actionError, setActionError] = useState('')

  async function remove(item) {
    if (!window.confirm(`¿Eliminar la reserva LR-${String(item.id).padStart(4, '0')}? Esta acción no se puede deshacer.`)) return
    try {
      await api.deleteReservation(item.id)
      setToast('La reserva se eliminó correctamente.')
      await reload()
    } catch (error) {
      setActionError(errorMessage(error))
    }
  }
  const filtered = (data || []).filter((item) => (
    (!status || item.estado === status) &&
    `${item.id} ${item.motivo} ${item.laboratorio_nombre} ${item.solicitante_nombre}`.toLowerCase().includes(search.toLowerCase())
  ))
  return (
    <>
      <PageHeader eyebrow="Gestión de espacios" title="Reservas" description="Consulta, filtra y administra las solicitudes de uso de laboratorios.">
        <Link className="button" to="/reservas/nueva"><Plus size={15} /> Nueva reserva</Link>
      </PageHeader>
      <section className="panel">
        <div className="toolbar">
          <div className="toolbar-controls">
            <label className="search-control"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar reservas..." aria-label="Buscar reservas" /></label>
            <select className="field-control" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrar por estado">
              <option value="">Todos los estados</option><option value="pendiente">Pendiente</option><option value="confirmada">Confirmada</option><option value="cancelada">Cancelada</option>
            </select>
          </div>
          <span className="page-description">{filtered.length} registros</span>
        </div>
        {actionError && <Toast message={actionError} error />}
        {loading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={reload} /> : <ReservationRows reservations={filtered} onDelete={remove} />}
      </section>
      <Toast message={toast} />
    </>
  )
}

export function ReservationFormPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const [options, setOptions] = useState({ laboratories: [], requesters: [] })
  const [initialValues, setInitialValues] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [laboratories, requesters, reservation] = await Promise.all([
          api.laboratories(), api.requesters(), editing ? api.reservation(id) : Promise.resolve(null),
        ])
        if (!active) return
        setOptions({ laboratories, requesters })
        setInitialValues(reservation ? {
          laboratorio_id: String(reservation.laboratorio_id), solicitante_id: String(reservation.solicitante_id),
          fecha: String(reservation.fecha).slice(0, 10), hora_inicio: String(reservation.hora_inicio).slice(0, 5),
          hora_fin: String(reservation.hora_fin).slice(0, 5), motivo: reservation.motivo,
          estado: reservation.estado, observaciones: reservation.observaciones || '',
        } : {
          laboratorio_id: new URLSearchParams(window.location.hash.split('?')[1] || '').get('laboratorio') || '',
          solicitante_id: '', fecha: new URLSearchParams(window.location.hash.split('?')[1] || '').get('fecha') || todayLocal(), hora_inicio: '', hora_fin: '',
          motivo: '', estado: 'pendiente', observaciones: '',
        })
      } catch (error) {
        if (active) setLoadError(errorMessage(error))
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [editing, id])

  async function submit(values, { setSubmitting, setStatus }) {
    setStatus('')
    try {
      const payload = { ...values, laboratorio_id: Number(values.laboratorio_id), solicitante_id: Number(values.solicitante_id) }
      if (editing) await api.updateReservation(id, payload)
      else await api.createReservation(payload)
      setToast(editing ? 'Los cambios de la reserva se guardaron.' : 'La reserva se registró correctamente.')
      navigate(editing ? `/reservas/${id}` : '/reservas', { state: { toast: editing ? 'Reserva actualizada correctamente.' : 'Reserva creada correctamente.' } })
    } catch (error) {
      setStatus(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingState label={editing ? 'Cargando reserva...' : 'Preparando formulario...'} />
  if (loadError) return <><PageHeader eyebrow="Reservas" title={editing ? 'Editar reserva' : 'Nueva reserva'} /><ErrorState error={loadError} /></>
  const activeLaboratories = options.laboratories.filter((item) => item.estado === 'activo')
  if (!activeLaboratories.length || !options.requesters.length) return <><PageHeader eyebrow="Reservas" title={editing ? 'Editar reserva' : 'Nueva reserva'} /><EmptyState title="Faltan datos para reservar" description="Se necesita al menos un laboratorio activo y un solicitante registrado antes de reservar." action={<Link className="button" to="/solicitantes">Ir a solicitantes</Link>} /></>

  return (
    <>
      <PageHeader eyebrow="Gestión de espacios" title={editing ? 'Editar reserva' : 'Nueva reserva'} description={editing ? 'Actualiza los datos. El sistema volverá a validar la disponibilidad.' : 'Completa los datos de la solicitud. Los conflictos se verifican también en el servidor.'}>
        <Link className="button button-secondary" to={editing ? `/reservas/${id}` : '/reservas'}><ArrowLeft size={14} /> Volver</Link>
      </PageHeader>
      <div className="form-layout">
        <Formik initialValues={initialValues} validationSchema={reservationSchema} onSubmit={submit} enableReinitialize>
          {({ isSubmitting, status }) => <Form className="form-card">
            <div className="form-grid">
              <FormField name="laboratorio_id" label="Laboratorio" as="select">
                <option value="">Selecciona un laboratorio</option>
                {activeLaboratories.map((item) => <option value={item.id} key={item.id}>{item.codigo} — {item.nombre}</option>)}
              </FormField>
              <FormField name="solicitante_id" label="Solicitante" as="select">
                <option value="">Selecciona un solicitante</option>
                {options.requesters.map((item) => <option value={item.id} key={item.id}>{item.nombres} {item.apellidos}</option>)}
              </FormField>
              <FormField name="fecha" label="Fecha" type="date" />
              <FormField name="estado" label="Estado" as="select">
                <option value="pendiente">Pendiente</option><option value="confirmada">Confirmada</option><option value="cancelada">Cancelada</option>
              </FormField>
              <FormField name="hora_inicio" label="Hora de inicio" type="time" />
              <FormField name="hora_fin" label="Hora de finalización" type="time" />
              <FormField name="motivo" label="Motivo de la reserva" full placeholder="Ej. Sesión de prácticas de desarrollo web" />
              <FormField name="observaciones" label="Observaciones (opcional)" as="textarea" full placeholder="Información adicional para la reserva" />
            </div>
            {status && <div className="toast error" role="alert">{status}</div>}
            <div className="form-actions">
              <Link className="button button-secondary" to={editing ? `/reservas/${id}` : '/reservas'}>Cancelar</Link>
              <button className="button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : editing ? 'Guardar cambios' : 'Registrar reserva'}</button>
            </div>
          </Form>}
        </Formik>
        <aside className="hint-card">
          <h3>Antes de reservar</h3>
          <p>La disponibilidad se confirma en el servidor al guardar para evitar que dos personas ocupen el mismo laboratorio simultáneamente.</p>
          <ul><li>La hora final debe ser posterior a la inicial.</li><li>Las reservas pendientes y confirmadas bloquean horario.</li><li>Las canceladas no bloquean la disponibilidad.</li></ul>
        </aside>
      </div>
      <Toast message={toast} />
    </>
  )
}

export function ReservationDetailPage() {
  const { id } = useParams()
  const { data, error, loading, reload } = useResource(() => api.reservation(id), [id])
  if (loading) return <LoadingState label="Cargando detalle..." />
  if (error) return <><PageHeader eyebrow="Reservas" title="Detalle de reserva" /><ErrorState error={error} onRetry={reload} /><Link className="button button-secondary" to="/reservas"><ArrowLeft size={14} /> Volver a reservas</Link></>
  return (
    <>
      <PageHeader eyebrow={`Reserva LR-${String(data.id).padStart(4, '0')}`} title="Detalle de reserva" description="Información registrada para esta solicitud.">
        <Link className="button button-secondary" to="/reservas"><ArrowLeft size={14} /> Volver</Link>
      </PageHeader>
      <section className="panel">
        <div className="panel-heading"><h2>Información de la solicitud</h2><StatusBadge status={data.estado} /></div>
        <div className="detail-grid">
          <div className="detail-item"><span>Laboratorio</span><strong>{data.laboratorio_codigo} · {data.laboratorio_nombre}</strong></div>
          <div className="detail-item"><span>Solicitante</span><strong>{data.solicitante_nombre}</strong></div>
          <div className="detail-item"><span>Fecha</span><strong>{formatDate(data.fecha)}</strong></div>
          <div className="detail-item"><span>Horario</span><strong>{String(data.hora_inicio).slice(0, 5)} – {String(data.hora_fin).slice(0, 5)}</strong></div>
          <div className="detail-item wide"><span>Motivo</span><strong>{data.motivo}</strong></div>
          <div className="detail-item wide"><span>Observaciones</span><strong>{data.observaciones || 'Sin observaciones'}</strong></div>
          <div className="detail-item"><span>Creada</span><strong>{new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' }).format(new Date(data.created_at))}</strong></div>
          <div className="detail-item"><span>Estado</span><strong>{statusLabel(data.estado)}</strong></div>
        </div>
        <div className="detail-actions"><Link className="button" to={`/reservas/${id}/editar`}><Pencil size={14} /> Editar reserva</Link></div>
      </section>
    </>
  )
}

export function LaboratoryPage() {
  const { data, error, loading, reload } = useResource(() => api.laboratories())
  const [search, setSearch] = useState('')
  const filtered = (data || []).filter((item) => `${item.codigo} ${item.nombre} ${item.ubicacion}`.toLowerCase().includes(search.toLowerCase()))
  return (
    <>
      <PageHeader eyebrow="Espacios de aprendizaje" title="Laboratorios" description="Consulta los ambientes disponibles, su capacidad y equipamiento.">
        <Link className="button" to="/reservas/nueva"><Plus size={15} /> Crear reserva</Link>
      </PageHeader>
      <div className="toolbar"><label className="search-control"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar laboratorio..." aria-label="Buscar laboratorio" /></label><span className="page-description">{filtered.length} espacios</span></div>
      {loading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={reload} /> : filtered.length ? <div className="laboratory-grid">{filtered.map((item) => <article className="laboratory-card" key={item.id}>
        <div className="laboratory-art"><span>{item.codigo}</span></div>
        <div className="laboratory-body"><h2>{item.nombre}</h2><p>{item.descripcion || 'Espacio de aprendizaje para actividades académicas y prácticas.'}</p>
          <div className="laboratory-meta"><span>⌖ {item.ubicacion}</span><span>◉ {item.capacidad} personas</span><span className={`lab-status ${item.estado === 'activo' ? 'is-active' : 'is-inactive'}`}>{item.estado === 'activo' ? 'Activo' : 'Inactivo'}</span></div>
          <div className="laboratory-equipment">{item.equipamiento || 'Equipamiento por confirmar'}</div>
          {item.estado === 'activo' && <Link className="button" to={`/reservas/nueva?laboratorio=${item.id}`}><CalendarDays size={14} /> Solicitar laboratorio</Link>}
        </div>
      </article>)}</div> : <EmptyState title="No encontramos laboratorios" description="Prueba con otro término de búsqueda." />}
    </>
  )
}

export function RequestersPage() {
  const { data, error, loading, reload } = useResource(() => api.requesters())
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const filtered = (data || []).filter((item) => `${item.nombres} ${item.apellidos} ${item.correo}`.toLowerCase().includes(search.toLowerCase()))
  async function create(values, { resetForm, setSubmitting, setStatus }) {
    setStatus('')
    try {
      await api.createRequester(values)
      resetForm()
      setToast('Solicitante registrado correctamente.')
      await reload()
    } catch (error) { setStatus(errorMessage(error)) }
    finally { setSubmitting(false) }
  }
  return (
    <>
      <PageHeader eyebrow="Directorio" title="Solicitantes" description="Personas ficticias de demostración disponibles para registrar reservas." />
      <div className="form-layout">
        <section className="panel">
          <div className="panel-heading"><h2>Personas registradas</h2></div>
          <div className="toolbar"><label className="search-control"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre o correo..." aria-label="Buscar solicitante" /></label></div>
          {loading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={reload} /> : filtered.length ? <div className="data-table-wrap"><table className="data-table">
            <thead><tr><th>Solicitante</th><th>Correo</th><th>Tipo</th></tr></thead>
            <tbody>{filtered.map((item) => <tr key={item.id}><td className="table-main">{item.nombres} {item.apellidos}</td><td>{item.correo}</td><td>{item.tipo_solicitante}</td></tr>)}</tbody>
          </table></div> : <EmptyState title="Sin solicitantes" description="Registra una persona para asignarla a una reserva." />}
        </section>
        <Formik initialValues={{ nombres: '', apellidos: '', correo: '', tipo_solicitante: 'instructor' }} validationSchema={requesterSchema} onSubmit={create}>
          {({ isSubmitting, status }) => <Form className="form-card">
            <div className="panel-heading"><h2>Registrar solicitante</h2></div>
            <div className="form-grid">
              <FormField name="nombres" label="Nombres" full placeholder="Nombres de demostración" />
              <FormField name="apellidos" label="Apellidos" full placeholder="Apellidos de demostración" />
              <FormField name="correo" label="Correo" type="email" full placeholder="nombre@example.com" />
              <FormField name="tipo_solicitante" label="Tipo" as="select" full><option value="instructor">Instructor</option><option value="personal">Personal autorizado</option><option value="otro">Otro</option></FormField>
            </div>
            {status && <div className="toast error" role="alert">{status}</div>}
            <div className="form-actions"><button className="button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Registrar'}</button></div>
          </Form>}
        </Formik>
      </div>
      <Toast message={toast} />
    </>
  )
}

export function CalendarPage() {
  const [date, setDate] = useState(todayLocal())
  const { data, error, loading, reload } = useResource(() => api.availability(date), [date])
  return (
    <>
      <PageHeader eyebrow="Planificación" title="Calendario de disponibilidad" description="Consulta reservas activas por laboratorio para el día seleccionado.">
        <Link className="button" to={`/reservas/nueva?fecha=${date}`}><Plus size={14} /> Nueva reserva</Link>
      </PageHeader>
      <section className="panel">
        <div className="calendar-toolbar">
          <div className="calendar-title">{data?.fecha ? formatDate(data.fecha) : 'Disponibilidad diaria'}</div>
          <div className="toolbar-controls">
            <button type="button" className="button button-secondary" aria-label="Día anterior" onClick={() => setDate((current) => shiftLocalDate(current, -1))}><ArrowLeft size={13} /></button>
            <input className="field-control" type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Seleccionar fecha" />
            <button type="button" className="button button-secondary" aria-label="Día siguiente" onClick={() => setDate((current) => shiftLocalDate(current, 1))}><ArrowRight size={13} /></button>
          </div>
        </div>
        {loading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={reload} /> : data.laboratorios.length ? <div className="calendar-list">{data.laboratorios.map((laboratory) => <article className="calendar-lab" key={laboratory.id}>
          <div className="calendar-lab-head"><strong>{laboratory.codigo} · {laboratory.nombre}</strong><small>{laboratory.reservas.length} reservas</small></div>
          <div className="time-slots">{Array.from({ length: 11 }, (_, index) => {
            const hour = index + 7
            const reservation = laboratory.reservas.find((item) => item.hora_inicio.slice(0, 2) <= String(hour).padStart(2, '0') && item.hora_fin.slice(0, 2) > String(hour).padStart(2, '0'))
            const className = reservation ? reservation.estado === 'pendiente' ? 'pending' : 'occupied' : ''
            return reservation ? <Link className={`time-slot ${className}`} to={`/reservas/${reservation.id}`} key={hour}><strong>{String(hour).padStart(2, '0')}:00</strong><small>{reservation.solicitante_nombre.split(' ')[0]}</small></Link> : <div className="time-slot" key={hour}><strong>{String(hour).padStart(2, '0')}:00</strong><small>Disponible</small></div>
          })}</div>
        </article>)}</div> : <EmptyState title="No hay laboratorios activos" description="Los espacios aparecerán aquí cuando estén registrados en la base de datos." />}
        <div className="academic-note">La vista muestra bloques horarios de 07:00 a 18:00. Selecciona una reserva para consultar su detalle.</div>
      </section>
    </>
  )
}

export function NotFoundPage() {
  return <div className="panel"><PageHeader eyebrow="Error 404" title="Página no encontrada" description="La dirección solicitada no existe." /><Link className="button" to="/">Volver al panel</Link></div>
}
