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

La SPA usa `HashRouter` para permitir navegación por rutas dinámicas en un hosting estático. El cliente concentra peticiones, errores HTTP y encabezado de escritura en `frontend/src/services/api.js`. Las páginas consultan datos reales; no se usa `localStorage` como persistencia.

## Backend

- `src/app.js`: Express, cabeceras seguras, JSON limitado, CORS y errores.
- `src/server.js`: configuración del puerto y cierre ordenado.
- `src/db/pool.js`: pool MySQL, TLS opcional y zona horaria UTC−05:00.
- `src/routes/api.js`: endpoints, SQL parametrizado y transacciones de reserva.
- `src/middlewares/writeAccess.js`: control de escritura `x-api-key` en producción (y si se configura, también en desarrollo).
- `src/utils/validation.js`: validación compartida de payload, fechas, horas y disponibilidad.

Para evitar carreras entre nuevas reservas del mismo laboratorio, una transacción bloquea su fila con `SELECT ... FOR UPDATE`, comprueba el solapamiento y realiza el `INSERT` antes del `COMMIT`. Esto requiere que las tablas usen InnoDB. En actualizaciones, la reserva actual queda excluida.

## Frontend

- `src/components/Layout.jsx`: navegación lateral, cabecera y entrada temporal de clave de escritura.
- `src/components/Common.jsx`: encabezados, estados de carga/error/vacío y notificaciones.
- `src/pages.jsx`: Dashboard, laboratorios, CRUD/listado/detalle de reservas, solicitantes y calendario.
- `src/services/api.js`: cliente JSON, configuración de URL y mensajes de error.
- `src/utils/format.js`: fechas y etiquetas locales.

Se priorizó un MVP sin cuentas de usuario: las lecturas son públicas; en producción una clave de escritura compartida protege mutaciones. Para un entorno real con usuarios se debe reemplazar por autenticación individual, autorización por roles, rotación y auditoría.

## Decisiones y límites

- La base de datos conserva las reservas; no se almacena el CRUD en memoria del navegador.
- La zona de negocio usa `America/Lima`/UTC−05:00.
- Los datos SQL de muestra son ficticios y reproducibles.
- La interfaz de laboratorios y solicitantes es de consulta/alta respectivamente; la administración CRUD de laboratorios no forma parte del MVP implementado.
- El calendario visualiza una jornada de 07:00 a 18:00 en bloques de una hora. El backend sigue validando el intervalo exacto.
- La clave compartida es una protección académica básica, no sustituye autenticación con usuarios.
