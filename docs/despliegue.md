# Despliegue y pasos pendientes

## GitHub Pages

El workflow `.github/workflows/pages.yml` construye `frontend` y publica `frontend/dist` al hacer push a `main`. Configura GitHub Pages para usar GitHub Actions y agrega la variable de repositorio `VITE_API_URL` con el origen del backend terminado en `/api`. El `base` de Vite está ajustado a `/senati-labreserve/`; cambia ese valor si el repositorio usa otro nombre.

## Render y MySQL administrado

`render.yaml` define la API, su health check y las variables de entorno. Completa host, usuario, contraseña, nombre de base de datos, CORS y TLS desde el panel de Render. Usa un servicio MySQL persistente externo (Aiven u otro compatible); importa los dos SQL desde una herramienta con permisos suficientes. No uses disco efímero para los datos.

`API_WRITE_KEY` se genera en Render. La interfaz no incorpora esa clave en su bundle: un operador autorizado la introduce en cada sesión desde “Acceso de escritura”. La lectura GET permanece pública en esta versión académica.

## Lista antes de publicar

- Crear repositorio remoto en GitHub y subir el monorepo; no hay remoto configurado en el entorno actual.
- Configurar secrets/variables y restringir acceso al proyecto y su clave.
- Sustituir `CORS_ORIGINS` por el origen exacto de GitHub Pages.
- Importar esquema y datos ficticios en la base administrada y verificar TLS.
- Ejecutar la suite y pruebas manuales de API/horarios concurrentes.
- Configurar GitHub Pages y validar las rutas, recursos y mutaciones a través del backend.
- No incluir nombres, credenciales ni datos reales de estudiantes.

El plan gratuito de Render puede suspender el servicio si no recibe tráfico; la reanudación inicial puede demorar. Un endpoint de health no elimina esa limitación.
