# SENATI LABRESERVE

Sistema académico demostrativo de gestión de reserva de laboratorios para SENATI — CFP Huaraz. Este proyecto no es un sistema institucional oficial y utiliza datos ficticios.

## Alcance implementado

- SPA en React con navegación por `HashRouter`, rutas protegidas frente a recargas de GitHub Pages y una página 404.
- Dashboard con contadores y próximas reservas en la API o el almacenamiento local de demostración.
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
| Despliegue | GitHub Pages (demo estática), Render opcional (API), MySQL |

El monorepo utiliza workspaces de npm. `frontend/src/pages.jsx` agrupa vistas relacionadas; los componentes reutilizables están en `frontend/src/components/`, la comunicación API en `frontend/src/services/`, y las reglas de negocio HTTP se implementan en `backend/src/routes/` y `backend/src/utils/`.

### Modelo de datos

- `laboratorios`: código único, ubicación, capacidad, equipamiento y estado.
- `solicitantes`: nombre, correo único y tipo.
- `reservas`: laboratorio, solicitante, fecha, horario, motivo, estado y observaciones.

Una reserva pendiente o confirmada bloquea disponibilidad; una cancelada no. Hay conflicto cuando `inicio_nuevo < fin_existente AND fin_nuevo > inicio_existente`. Antes de comprobar e insertar/actualizar, el backend bloquea con `SELECT ... FOR UPDATE` la fila del laboratorio dentro de una transacción. Las reservas consecutivas son válidas y la actualización excluye su propio identificador.

## Requisitos

- Node.js 20.19+ o 22.12+ (Vite actual requiere una versión moderna; Node 22 LTS es recomendado).
- npm.

## Modalidades de ejecución

### Full Stack local (API y MySQL)

Esta modalidad conserva la autenticación real, los permisos por rol y la persistencia compartida del backend. Requiere Node.js, npm y MySQL 8+ o MariaDB compatible (XAMPP/phpMyAdmin sirve para desarrollo local). Sigue los pasos de instalación local indicados abajo. En `frontend/.env`, configura `VITE_DATA_MODE=api` y `VITE_API_URL=http://localhost:3000/api`; ese es el modo predeterminado si no se define `VITE_DATA_MODE`.

### Demostración estática en GitHub Pages

El workflow de GitHub Pages compila con `VITE_DATA_MODE=demo`; no requiere `VITE_API_URL`, Node.js instalado por el visitante, XAMPP, Render ni un backend. En la pantalla inicial, selecciona **Acceder a demostración**. No se solicitan credenciales y esta entrada no representa autenticación ni seguridad.

La demostración usa datos ficticios y guarda reservas, laboratorios y solicitantes en `localStorage` del navegador. Los cambios sobreviven a recargas en el mismo navegador, pero no se sincronizan entre dispositivos o visitantes y no se guardan en la base de datos MySQL. La modalidad está identificada en la interfaz como **DEMOSTRACIÓN · DATOS LOCALES**. Para una publicación Full Stack con backend, compila con `VITE_DATA_MODE=api` y configura `VITE_API_URL`.

## Instalación local en Windows

Desde PowerShell, en la carpeta del proyecto:

1. Inicia Apache/MySQL en XAMPP y selecciona `bd_reservas_laboratorios_senati` en phpMyAdmin.
2. Para una base vacía, importa `database/schema.sql`. Si ya tenía el esquema antiguo, ejecuta una sola vez `database/migrations/001_usuarios.sql` y luego `database/migrations/002_reservation_owner.sql`. No importes ambos caminos.
3. Opcionalmente importa `database/seed.sql` para cargar los datos ficticios de demostración.
4. Copia `backend/.env.example` a `backend/.env`, configura la conexión local de MySQL y define `AUTH_TOKEN_SECRET` con al menos 32 caracteres aleatorios. Puedes generar uno con `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`. El `.env` está excluido de Git; no uses un secreto real en los archivos `.example`.
5. Copia `frontend/.env.example` a `frontend/.env` si la API no está en `http://localhost:3000/api`.
   Define también `VITE_DATA_MODE=api` para indicar explícitamente el modo Full Stack.
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

### GitHub Pages (modo demostración)

1. Habilita GitHub Pages con GitHub Actions y publica la rama `main`. El workflow `.github/workflows/pages.yml` instala y compila `frontend/dist` con `VITE_DATA_MODE=demo`; no necesita variables o secretos de API.
2. La base de Vite se configura como `/senati-labreserve/` en producción y `HashRouter` mantiene la navegación estática compatible.
3. La URL pública es `https://Stiven-cloud276.github.io/senati-labreserve/`. GitHub Pages solo sirve archivos estáticos; esta modalidad usa almacenamiento local del navegador y no se conecta a MySQL.

Para desplegar el frontend conectado a una API real, configura un workflow/entorno que compile con `VITE_DATA_MODE=api` y `VITE_API_URL` apuntando a la API HTTPS. Mantén las credenciales privadas solo en el backend; no coloques secretos en variables `VITE_*`.

El remoto del proyecto es `https://github.com/Stiven-cloud276/senati-labreserve`. Estos cambios se preparan localmente y no se publicarán hasta recibir autorización para hacer push.

### Git y GitHub

El repositorio Git local contiene `main` y `feature/reservas`; el trabajo de demostración se prepara en `feature/github-pages-demo` y se integra localmente a `main`. El remoto configurado apunta al repositorio indicado arriba. No se debe ejecutar `git push` hasta tener autorización explícita.

Al publicar `main`, GitHub Actions compilará y desplegará la demostración estática si GitHub Pages está configurado para usar GitHub Actions. El enlace público es `https://Stiven-cloud276.github.io/senati-labreserve/`; la disponibilidad del despliegue depende de la configuración de Pages y de que el workflow termine correctamente.

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
