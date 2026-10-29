# Despliegue y pasos pendientes

## GitHub Pages

El workflow `.github/workflows/pages.yml` construye `frontend` y publica `frontend/dist` al hacer push a `main`. Configura GitHub Pages para usar GitHub Actions y agrega la variable de repositorio `VITE_API_URL` con el origen del backend terminado en `/api`. El `base` de Vite está ajustado a `/senati-labreserve/`; cambia ese valor si el repositorio usa otro nombre.

## Render y MySQL administrado

`render.yaml` define la API, su health check y las variables de entorno. Completa host, usuario, contraseña, nombre de base de datos, CORS y TLS desde el panel de Render. Usa un servicio MySQL persistente externo (Aiven u otro compatible); importa el esquema y, opcionalmente, los datos de muestra desde una herramienta con permisos suficientes. No uses disco efímero para los datos.

El blueprint genera `AUTH_TOKEN_SECRET`; mantenlo solo como variable privada del backend. Crea el administrador inicial mediante `npm run create-admin --workspace backend` desde un entorno interactivo conectado a la base. El registro público crea exclusivamente cuentas estándar. Las rutas de datos exigen Bearer token.

## Lista antes de publicar

- Crear repositorio remoto en GitHub y subir el monorepo; no hay remoto configurado en el entorno actual.
- Configurar secrets/variables y restringir acceso al proyecto.
- Sustituir `CORS_ORIGINS` por el origen exacto de GitHub Pages.
- Importar esquema (y, opcionalmente, datos ficticios) en la base administrada y verificar TLS.
- Crear la primera cuenta administradora desde una terminal segura.
- Ejecutar la suite y pruebas manuales de API/horarios concurrentes.
- Configurar GitHub Pages y validar las rutas, recursos y mutaciones a través del backend.
- No incluir nombres, credenciales ni datos reales de estudiantes.

El plan gratuito de Render puede suspender el servicio si no recibe tráfico; la reanudación inicial puede demorar. Un endpoint de health no elimina esa limitación.
