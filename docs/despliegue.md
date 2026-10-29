# Despliegue y pasos pendientes

## GitHub Pages (demostración estática)

El workflow `.github/workflows/pages.yml` compila `frontend` con `VITE_DATA_MODE=demo` y publica `frontend/dist` al hacer push a `main`. No requiere `VITE_API_URL`, backend, secretos de API ni XAMPP. Configura GitHub Pages para publicar mediante GitHub Actions. Vite usa la base `/senati-labreserve/` y `HashRouter` conserva el enrutamiento compatible con hosting estático.

La demostración permite consultar laboratorios, reservas y disponibilidad, y crear/editar/eliminar registros. Los datos son ficticios y se guardan en `localStorage` del navegador; no se comparten ni se sincronizan con MySQL. La pantalla y la barra superior identifican claramente este modo. URL esperada: `https://Stiven-cloud276.github.io/senati-labreserve/`.

## Frontend Full Stack

Para conectar la interfaz con una API real, compila con `VITE_DATA_MODE=api` y `VITE_API_URL` apuntando al backend por HTTPS y terminado en `/api`. Las variables `VITE_*` se incorporan al bundle y no deben contener contraseñas, tokens ni credenciales privadas.

## Render y MySQL administrado

`render.yaml` define la API, su health check y las variables de entorno. Completa host, usuario, contraseña, nombre de base de datos, CORS y TLS desde el panel de Render. Usa un servicio MySQL persistente externo (Aiven u otro compatible); importa el esquema y, opcionalmente, los datos de muestra desde una herramienta con permisos suficientes. No uses disco efímero para los datos.

El blueprint genera `AUTH_TOKEN_SECRET`; mantenlo solo como variable privada del backend. Crea el administrador inicial mediante `npm run create-admin --workspace backend` desde un entorno interactivo conectado a la base. El registro público crea exclusivamente cuentas estándar. Las rutas de datos exigen Bearer token.

## Backend Render y MySQL

Para la modalidad Full Stack, `render.yaml` define la API, su health check y las variables de entorno. Completa host, usuario, contraseña, nombre de base de datos, CORS y TLS desde Render. Usa MySQL persistente; importa esquema y, opcionalmente, datos ficticios con permisos suficientes. El blueprint genera `AUTH_TOKEN_SECRET`, que debe permanecer privado en el backend.

El primer administrador se crea con `npm run create-admin --workspace backend` desde una terminal interactiva conectada a la base. El registro público solo crea usuarios estándar; las rutas de datos requieren autenticación. Mantén `CORS_ORIGINS` configurado con los orígenes que realmente utilizarán la API.

## Lista antes de publicar

- Habilitar GitHub Pages con GitHub Actions y verificar la ejecución del workflow.
- Para un despliegue Full Stack, probar API, MySQL, autenticación, CORS y conflictos horarios.
- No incluir nombres, credenciales ni datos reales de estudiantes.

El plan gratuito de Render puede suspender el servicio si no recibe tráfico; la reanudación inicial puede demorar. Un endpoint de health no elimina esa limitación.
