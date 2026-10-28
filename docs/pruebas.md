# Pruebas y resultados

## Pruebas automatizadas del backend

`backend/tests/validation.test.js` utiliza el test runner nativo `node:test` para comprobar:

1. Normalización de horarios y aceptación de un payload válido.
2. Rechazo de fecha inexistente y duración cero.
3. Detección de superposición y aceptación de horarios consecutivos.

Ejecutar desde la raíz:

```powershell
npm test
```

## Verificaciones de frontend

```powershell
npm run build
npm run lint
```

El build valida que las rutas, componentes y dependencias puedan compilarse. El lint se ejecuta con la configuración oxlint generada por Vite.

## Verificación integrada manual (requiere XAMPP/MySQL)

1. Importar `database/schema.sql` y `database/seed.sql`.
2. Iniciar backend y frontend según el README.
3. Consultar `http://localhost:3000/api/health`.
4. Crear una reserva desde la interfaz, revisar el listado, refrescar y consultar `GET /api/reservas/:id`.
5. Editar y eliminar una reserva de muestra.
6. Intentar una reserva superpuesta en el mismo laboratorio (409); repetir el intervalo en otro laboratorio y verificar que se acepte.
7. Crear dos reservas consecutivas y editar una reserva sin que se detecte conflicto consigo misma.
8. Enviar solicitudes concurrentes con el mismo laboratorio/fecha/horario: una debe tener éxito y la otra recibir 409.
9. Apagar el backend y verificar que la interfaz muestra un error de conexión.
10. Probar escritorio y móvil; confirmar navegación por teclado y foco visible.

## Resultados de esta sesión

- `npm test`: aprobado; 4 pruebas unitarias, 0 fallos (validación, intervalos y clave de escritura).
- `npm run build`: aprobado; Vite generó el build de producción.
- `npm run lint`: aprobado sin advertencias.
- `node --check` en `app.js`, `server.js` y `routes/api.js`: aprobado.
- API Express: la ruta desconocida devolvió HTTP 404 con el mensaje JSON esperado.
- Interfaz en navegador: cargó la SPA en escritorio y viewport móvil; se comprobó la navegación lateral móvil y el estado de error del dashboard cuando la API no está disponible.
- MySQL: el puerto local 3306 responde, pero la cuenta de plantilla `labreserve_app` sin contraseña fue rechazada. No se modificó ninguna base de datos. Por ello, no se verificaron persistencia, CRUD integrado ni transacciones concurrentes contra MySQL.
- GitHub Pages/Render: no desplegados; no hay remoto ni configuración pública.

La suite automatizada no reemplaza los casos manuales que requieren credenciales de MySQL; ejecutar los pasos anteriores al conectar XAMPP.
