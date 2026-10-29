# Arquitectura

## Vista general

```text
Navegador (React/Vite)
       │ JSON + HTTPS; CORS
       ▼
API REST (Express en Render)
       │ mysql2/promise + transacciones InnoDB
       ▼
MySQL/MariaDB administrado
```

La SPA usa `HashRouter` para permitir navegación por rutas dinámicas en un hosting estático. El cliente concentra peticiones, errores HTTP y el token Bearer en memoria en `frontend/src/services/api.js`. Las páginas consultan datos reales; no se usa `localStorage` como persistencia.

## Backend

- `src/app.js`: Express, cabeceras seguras, JSON limitado, CORS y errores.
- `src/server.js`: configuración del puerto y cierre ordenado.
- `src/db/pool.js`: pool MySQL, TLS opcional y zona horaria UTC−05:00.
- `src/routes/api.js`: endpoints, SQL parametrizado y transacciones de reserva.
- `src/middlewares/auth.js`: emisión y verificación de JWT y autorización por rol.
- `src/services/accounts.js`: validación de cuentas, bcrypt y consultas de usuarios.
- `scripts/create-admin.js`: aprovisionamiento interactivo del primer administrador.
- `src/utils/validation.js`: validación compartida de payload, fechas, horas y disponibilidad.

Para evitar carreras entre nuevas reservas del mismo laboratorio, una transacción bloquea su fila con `SELECT ... FOR UPDATE`, comprueba el solapamiento y realiza el `INSERT` antes del `COMMIT`. Esto requiere que las tablas usen InnoDB. En actualizaciones, la reserva actual queda excluida.

## Frontend

- `src/components/Layout.jsx`: navegación lateral, identidad de usuario y cierre de sesión.
- `src/components/Common.jsx`: encabezados, estados de carga/error/vacío y notificaciones.
- `src/pages.jsx`: Dashboard, laboratorios, CRUD/listado/detalle de reservas, solicitantes y calendario.
- `src/services/api.js`: cliente JSON, configuración de URL y mensajes de error.
- `src/utils/format.js`: fechas y etiquetas locales.

El registro público solo crea usuarios estándar. La creación del administrador se limita al comando local `npm run create-admin --workspace backend`. El middleware autentica todas las rutas de datos. Los usuarios pueden consultar y registrar reservas y solicitantes, pero no editar ni eliminar registros ni confirmar reservas; solo el administrador registra laboratorios y puede cambiar estados, editar o eliminar reservas. El token JWT expira a las dos horas y el navegador no lo persiste tras recargar.

## Decisiones y límites

- La base de datos conserva las reservas; no se almacena el CRUD en memoria del navegador.
- La zona de negocio usa `America/Lima`/UTC−05:00.
- Los datos SQL de muestra son ficticios y reproducibles.
- La interfaz permite registrar laboratorios desde un modal para administradores y solicitantes desde un modal para usuarios autenticados.
- El calendario visualiza una jornada de 07:00 a 18:00 en bloques de una hora. El backend sigue validando el intervalo exacto.
