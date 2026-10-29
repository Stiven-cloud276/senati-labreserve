import { useState } from 'react'
import { ErrorMessage, Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import { ArrowRight, Eye, EyeOff, FlaskConical, LockKeyhole, UserRoundPlus } from 'lucide-react'
import { api } from './services/api'
import { errorMessage } from './utils/format'
import { Modal } from './components/Common'

const loginSchema = Yup.object({
  correo: Yup.string().email('Ingresa un correo válido.').required('Ingresa tu correo.'),
  password: Yup.string().required('Ingresa tu contraseña.'),
})

const registerSchema = Yup.object({
  nombres: Yup.string().trim().min(2, 'Escribe al menos 2 caracteres.').max(80, 'Máximo 80 caracteres.').required('Ingresa tus nombres.'),
  apellidos: Yup.string().trim().min(2, 'Escribe al menos 2 caracteres.').max(80, 'Máximo 80 caracteres.').required('Ingresa tus apellidos.'),
  correo: Yup.string().email('Ingresa un correo válido.').max(160, 'Máximo 160 caracteres.').required('Ingresa tu correo.'),
  password: Yup.string().min(12, 'La contraseña debe tener al menos 12 caracteres.').max(72, 'La contraseña supera el límite admitido.').required('Crea una contraseña.'),
  confirmPassword: Yup.string().oneOf([Yup.ref('password')], 'Las contraseñas no coinciden.').required('Confirma tu contraseña.'),
})

const logo = `${import.meta.env.BASE_URL}senati-logo.png`

function Logo({ compact = false }) {
  return (
    <div className={`auth-brand ${compact ? 'compact' : ''}`}>
      <img src={logo} alt="Logotipo de SENATI" />
      <div>
        <strong>LABRESERVE</strong>
        <span>SENATI · CFP HUARAZ</span>
      </div>
    </div>
  )
}

function AccountField({ name, label, type = 'text', placeholder, autoComplete }) {
  return (
    <div className="form-field">
      <label htmlFor={`account-${name}`}>{label}</label>
      <Field id={`account-${name}`} name={name} type={type} placeholder={placeholder} autoComplete={autoComplete} />
      <ErrorMessage name={name} component="span" className="field-error" />
    </div>
  )
}

function RegisterDialog({ onClose, onAuthenticate }) {
  async function register(values, { setStatus, setSubmitting }) {
    setStatus('')
    try {
      const { confirmPassword: _confirmPassword, ...account } = values
      const result = await api.register(account)
      onAuthenticate(result)
    } catch (error) {
      setStatus(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Crear cuenta" onClose={onClose}>
      <p className="modal-intro">Regístrate para ingresar y gestionar las solicitudes de laboratorios. Las cuentas nuevas tienen permisos de usuario; el rol administrador se asigna localmente.</p>
      <Formik initialValues={{ nombres: '', apellidos: '', correo: '', password: '', confirmPassword: '' }} validationSchema={registerSchema} onSubmit={register}>
        {({ isSubmitting, status }) => <Form>
          <div className="form-grid">
            <AccountField name="nombres" label="Nombres" placeholder="Tus nombres" autoComplete="given-name" />
            <AccountField name="apellidos" label="Apellidos" placeholder="Tus apellidos" autoComplete="family-name" />
            <div className="form-field full"><AccountField name="correo" label="Correo electrónico" type="email" placeholder="tu-correo@example.com" autoComplete="email" /></div>
            <div className="form-field full"><AccountField name="password" label="Contraseña (mínimo 12 caracteres)" type="password" placeholder="Crea una contraseña segura" autoComplete="new-password" /></div>
            <div className="form-field full"><AccountField name="confirmPassword" label="Confirma tu contraseña" type="password" placeholder="Repite la contraseña" autoComplete="new-password" /></div>
          </div>
          {status && <div className="inline-error" role="alert">{status}</div>}
          <div className="form-actions">
            <button type="button" className="button button-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="button" disabled={isSubmitting}>{isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}</button>
          </div>
        </Form>}
      </Formik>
    </Modal>
  )
}

export default function LoginPage({ onAuthenticate, demoMode = false, onDemo }) {
  const [registerOpen, setRegisterOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function login(values, { setStatus, setSubmitting }) {
    setStatus('')
    try {
      onAuthenticate(await api.login(values))
    } catch (error) {
      setStatus(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="auth-visual-orbit orbit-one" />
        <div className="auth-visual-orbit orbit-two" />
        <Logo />
        <div className="auth-visual-copy">
          <span className="auth-kicker"><FlaskConical size={14} /> PLATAFORMA ACADÉMICA</span>
          <h1>Tu espacio de aprendizaje, mejor organizado.</h1>
          <p>Consulta laboratorios, revisa disponibilidad y gestiona las reservas del SENATI CFP Huaraz.</p>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-mobile-brand"><Logo compact /></div>
        <div className="auth-form-wrap">
          {demoMode ? <>
            <h2>Explora LABRESERVE</h2>
            <p className="auth-subtitle">Ingresa al modo demostrativo con datos ficticios guardados solo en este navegador.</p>
            <button type="button" className="button auth-submit demo-entry-button" onClick={onDemo}>
              Acceder a demostración <ArrowRight size={15} />
            </button>
            <div className="demo-disclaimer">Esta demostración no utiliza cuentas ni protege datos. Los cambios se guardan en este navegador y no se sincronizan con otros navegadores o dispositivos.</div>
          </> : <>
            <h2>Iniciar sesión</h2>
            <p className="auth-subtitle">Ingresa tus credenciales para continuar a LABRESERVE.</p>
          <Formik initialValues={{ correo: '', password: '' }} validationSchema={loginSchema} onSubmit={login}>
            {({ isSubmitting, status }) => <Form className="auth-form">
              <AccountField name="correo" label="Correo electrónico" type="email" placeholder="tu-correo@example.com" autoComplete="username" />
              <div className="form-field">
                <label htmlFor="account-password">Contraseña</label>
                <div className="password-field">
                  <Field id="account-password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Ingresa tu contraseña" autoComplete="current-password" />
                  <button type="button" className="password-toggle" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <ErrorMessage name="password" component="span" className="field-error" />
              </div>
              {status && <div className="inline-error" role="alert">{status}</div>}
              <button type="submit" className="button auth-submit" disabled={isSubmitting}>{isSubmitting ? 'Verificando...' : <>Ingresar <ArrowRight size={15} /></>}</button>
            </Form>}
          </Formik>
          <div className="auth-register-prompt">
            <span>¿Aún no tienes una cuenta?</span>
            <button type="button" onClick={() => setRegisterOpen(true)}><UserRoundPlus size={15} /> Registrarme</button>
          </div>
          <div className="auth-security-note"><LockKeyhole size={13} /> Las contraseñas se almacenan cifradas y no se guardan en este navegador.</div>
          </>}
        </div>
      </section>
      {registerOpen && <RegisterDialog onClose={() => setRegisterOpen(false)} onAuthenticate={onAuthenticate} />}
    </main>
  )
}
