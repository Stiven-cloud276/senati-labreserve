# Ficha de planificación — Proyecto N.° 01

| Campo | Definición |
|---|---|
| Proyecto | Sistema Web de Gestión de Reserva de Laboratorios SENATI |
| Nombre propuesto | SENATI LABRESERVE |
| Modalidad | Individual |
| Institución de referencia | SENATI — CFP Huaraz |
| Problema | La gestión de solicitudes puede generar desconocimiento de horarios, duplicidad de reservas y dificultad para consultar registros. Es un escenario académico propuesto, no un diagnóstico institucional confirmado. |
| Objetivo | Desarrollar una SPA full stack para consultar laboratorios y registrar, administrar y revisar reservas persistidas en MySQL, evitando conflictos de horario. |
| Tecnologías | React, Vite, React Router, Formik, Yup, Node.js, Express, mysql2/promise, MySQL/MariaDB, Git y GitHub. |
| Entidades | Laboratorios, solicitantes y reservas. |
| Pantallas | Dashboard, laboratorios, listado/nueva/edición/detalle de reservas, solicitantes, calendario diario y página 404. |
| Ruta dinámica | `/reservas/:id` (navegación mediante `HashRouter` en Pages). |
| Repositorio | Repositorio Git local en `main`, rama de trabajo `feature/reservas`; no hay remoto configurado ni enlace público. |
| Despliegue | Preparado para GitHub Pages + Render + MySQL administrado; sin despliegue ejecutado. |

## Historias de usuario

1. Como solicitante, quiero consultar laboratorios y su equipamiento para elegir un espacio.
2. Como solicitante, quiero registrar una reserva indicando persona, laboratorio, fecha, horario y motivo.
3. Como usuario, quiero recibir una advertencia si otra reserva ocupa el intervalo elegido.
4. Como usuario, quiero modificar o eliminar una reserva y consultar sus detalles.
5. Como usuario, quiero filtrar reservas y revisar la agenda diaria.
6. Como administrador de demostración, quiero registrar solicitantes ficticios para asignarlos a una reserva.

## Casos de prueba propuestos

- Crear una reserva válida, recargar y verificar persistencia en MySQL/API.
- Rechazar fecha inválida, fin anterior/igual al inicio y payload vacío.
- Rechazar intervalos superpuestos en el mismo laboratorio.
- Aceptar reservas en laboratorios distintos y bloques consecutivos.
- Editar una reserva sin conflicto consigo misma; devolver 404 para ID inexistente.
- Eliminar con confirmación y verificar HTTP 204.
- Enviar dos solicitudes concurrentes al mismo intervalo: una debe crear y la otra recibir 409.
- Validar la ruta dinámica, navegación SPA, mensajes cuando la API no responde y diseño adaptable.

Los resultados efectivamente ejecutados están registrados en `docs/pruebas.md`; los casos que requieren una base local o navegador permanecen pendientes hasta ser probados.
