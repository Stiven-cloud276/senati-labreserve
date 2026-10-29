# SENATI LABRESERVE

Sistema académico demostrativo de gestión de reserva de laboratorios para SENATI — CFP Huaraz. Este proyecto no es un sistema institucional oficial y utiliza datos ficticios.

## Alcance implementado

- SPA en React con navegación por `HashRouter`, rutas protegidas frente a recargas de GitHub Pages y una página 404.
- Dashboard con contadores y próximas reservas consultados desde la API.
- Consulta de laboratorios, buscador, directorio de solicitantes y registro de solicitantes.
- CRUD de reservas: listado, búsqueda, filtro, detalle, alta, edición y eliminación confirmada.
- Calendario diario por laboratorio; selección de fecha y acceso al detalle de cada reserva.
- Formularios de reserva con Formik/Yup y validación complementaria en el servidor.
- Persistencia MySQL/MariaDB y prevención transaccional de reservas superpuestas.
- Inicio de sesión, auto-registro de usuarios y permisos separados por rol.
- Formularios de alta en modales, incluido el registro de laboratorios para administradores.
- Diseño adaptable y manejo de estados de carga/error.

## Tecnologías y arquitectura

| Capa | Tecnologías |
|---|---|
| Frontend | React, Vite, JavaScript, React Router, Formik, Yup, Lucide React |
| Backend | Node.js, Express, mysql2/promise, dotenv, JWT, bcrypt, CORS, Helmet |
| Datos | MySQL/MariaDB, InnoDB, claves foráneas e índices |
| Despliegue | GitHub Pages (frontend), Render (API), MySQL administrado externo |

El monorepo utiliza workspaces de npm. `frontend/src/pages.jsx` agrupa vistas relacionadas; los componentes reutilizables están en `frontend/src/components/`, la comunicación API en `frontend/src/services/`, y las reglas de negocio HTTP se implementan en `backend/src/routes/` y `backend/src/utils/`.

### Modelo de datos

- `laboratorios`: código único, ubicación, capacidad, equipamiento y estado.
- `solicitantes`: nombre, correo único y tipo.
- `reservas`: laboratorio, solicitante, fecha, horario, motivo, estado y observaciones.

Una reserva pendiente o confirmada bloquea disponibilidad; una cancelada no. Hay conflicto cuando `inicio_nuevo < fin_existente AND fin_nuevo > inicio_existente`. Antes de comprobar e insertar/actualizar, el backend bloquea con `SELECT ... FOR UPDATE` la fila del laboratorio dentro de una transacción. Las reservas consecutivas son válidas y la actualización excluye su propio identificador.

## Requisitos

- Node.js 20.19+ o 22.12+ (Vite actual requiere una versión moderna; Node 22 LTS es recomendado).
- npm.
- MySQL 8+ o MariaDB compatible y XAMPP/phpMyAdmin para el flujo local.

## Instalación local en Windows

Desde PowerShell, en la carpeta del proyecto:

1. Inicia Apache/MySQL en XAMPP y selecciona `bd_reservas_laboratorios_senati` en phpMyAdmin.
2. Para una base vacía, importa `database/schema.sql`. Si ya tenía el esquema antiguo, ejecuta una sola vez `database/migrations/001_usuarios.sql` y luego `database/migrations/002_reservation_owner.sql`. No importes ambos caminos.
3. Opcionalmente importa `database/seed.sql` para cargar los datos ficticios de demostración.
4. Copia `backend/.env.example` a `backend/.env`, configura la conexión local de MySQL y define `AUTH_TOKEN_SECRET` con al menos 32 caracteres aleatorios. Puedes generar uno con `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`. El `.env` está excluido de Git; no uses un secreto real en los archivos `.example`.
5. Copia `frontend/.env.example` a `frontend/.env` si la API no está en `http://localhost:3000/api`.
6. Instala e inicia:

```powershell
npm install
npm run dev:backend
```

En otra terminal:

```powershell
npm run dev:frontend
```

Abre la URL que muestre Vite (habitualmente `http://localhost:5173`). El endpoint `/api/health` comprueba la conexión a MySQL. Si el esquema aún no se ha importado, primero prepara las tablas y después crea el administrador:

```powershell
npm run create-admin --workspace backend
```

El comando solicita los datos de la cuenta en una terminal interactiva y solo crea el primer administrador. Los visitantes pueden crear una cuenta estándar desde la pantalla de acceso; el auto-registro no permite asignar el rol de administrador.

### Cuenta de MySQL con privilegios limitados

Después de importar el esquema con una cuenta administradora, se puede crear un usuario exclusivo para la aplicación (reemplaza host y contraseña localmente):

```sql
CREATE USER 'labreserve_app'@'localhost' IDENTIFIED BY 'CAMBIA_ESTA_CLAVE';
GRANT SELECT, INSERT, UPDATE, DELETE ON bd_reservas_laboratorios_senati.* TO 'labreserve_app'@'localhost';
FLUSH PRIVILEGES;
```

El backend solo necesita leer y modificar las tablas existentes; no necesita permisos para crear bases o tablas.

## API REST

Todas las respuestas exitosas usan `{ "data": ... }`; los errores usan `{ "error": { "message": "..." } }`.

| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/health` | Estado del proceso y conexión de datos |
| POST | `/api/auth/register` | Crear cuenta estándar |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Consultar la cuenta autenticada |
| GET | `/api/dashboard` | Indicadores y próximas reservas |
| GET | `/api/laboratorios` | Laboratorios |
| GET, POST | `/api/solicitantes` | Listar y registrar solicitantes |
| GET | `/api/reservas` | Listar; admite `estado`, `fecha` y `buscar` |
| GET | `/api/reservas/:id` | Detalle |
| POST | `/api/reservas` | Crear |
| PUT | `/api/reservas/:id` | Actualizar |
| DELETE | `/api/reservas/:id` | Eliminar (respuesta 204) |
| GET | `/api/disponibilidad?fecha=AAAA-MM-DD` | Reservas agrupadas por laboratorio |

Todas las rutas salvo health, login y registro requieren un token Bearer. Los usuarios pueden consultar y registrar reservas y solicitantes; no pueden editar ni eliminar registros, ni confirmar reservas. El administrador puede registrar laboratorios, cambiar estados, editar y eliminar reservas. El servidor valida fechas reales, horas, estados, longitudes e identificadores; utiliza consultas parametrizadas. Un conflicto responde HTTP 409. Las fechas y el calendario se operan en `America/Lima` (UTC−05:00). El token se conserva en memoria: al recargar la página se debe iniciar sesión nuevamente.

## Configuración y despliegue

### Render (backend)

1. Crea una base MySQL administrada fuera de Render y carga `database/schema.sql` y `database/seed.sql`.
2. Despliega este repositorio en Render usando `render.yaml` o configura como directorio raíz el repositorio y ejecuta `npm ci`; comando de inicio: `npm run start --workspace backend`.
3. Configura `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL=true` y `CORS_ORIGINS`. El blueprint genera `AUTH_TOKEN_SECRET`; conserva el valor solo en Render y no lo incluyas en el frontend. `CORS_ORIGINS` debe contener el origen exacto de GitHub Pages, por ejemplo `https://USUARIO.github.io` (sin ruta).
4. Importa el esquema y crea el primer administrador ejecutando `npm run create-admin --workspace backend` desde una terminal interactiva con las variables de conexión disponibles.
5. `/api/health` verifica la conectividad MySQL. El plan gratuito de Render puede suspender el servicio por inactividad; la primera petición posterior puede tardar.

### GitHub Pages (frontend)

1. Configura en el repositorio GitHub la variable de Actions `VITE_API_URL` con la URL HTTPS de la API más `/api`, por ejemplo `https://tu-api.onrender.com/api`.
2. Habilita GitHub Pages con GitHub Actions y publica la rama `main`. El workflow `.github/workflows/pages.yml` instala, compila y publica `frontend/dist`.
3. El `base` de Vite y `HashRouter` están preparados para el repositorio `senati-labreserve`. Si el nombre del repositorio cambia, actualiza `frontend/vite.config.js`.
4. Añade el origen público `https://USUARIO.github.io` a `CORS_ORIGINS` en Render. GitHub Pages solo sirve archivos estáticos: el backend y MySQL deben desplegarse por separado.

No se han creado repositorios remotos ni se han realizado despliegues. No hay URL pública configurada en este proyecto.

### Git y GitHub

El repositorio Git local contiene `main` y la rama `feature/reservas`, con el desarrollo integrado en `main`. No hay remoto configurado. Cuando se cree el repositorio en GitHub, agrega su URL y publica ambas ramas:

```powershell
git remote add origin https://github.com/USUARIO/senati-labreserve.git
git push -u origin main
git push -u origin feature/reservas
```

El PR y el enlace público deben añadirse únicamente después de crearlos realmente.

## Pruebas y estado de validación

Las pruebas unitarias verifican autenticación/autorización y validación de reservas. Ejecuta:

```powershell
npm test
npm run build
npm run lint
```

Las pruebas de integración que requieren MySQL/XAMPP y pruebas visuales en navegadores/dispositivos deben ejecutarse en el entorno local antes de declarar como verificadas la persistencia, la carrera concurrente, CORS y el despliegue. Consulta `docs/pruebas.md`.

## Comparación breve: React y Vue

React ofrece una composición flexible basada en componentes y un ecosistema amplio para integrar rutas, formularios y servicios de datos. Vue proporciona convenciones más integradas y una curva inicial sencilla con plantillas declarativas. Se eligió React por el requisito de la actividad y su integración directa con Vite y React Router; la decisión no implica que una opción sea universalmente superior.

## Documentación académica

- [Arquitectura y decisiones](docs/arquitectura.md)
- [Ficha de planificación](docs/planificacion.md)
- [Pruebas reproducibles](docs/pruebas.md)
- [Despliegue y limitaciones](docs/despliegue.md)

La guía PDF referenciada en el enunciado no estaba disponible en la carpeta inspeccionada; la ficha se organizó con los campos descritos en el prompt y debe contrastarse con el formato original antes de su entrega académica.
