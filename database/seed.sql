USE bd_reservas_laboratorios_senati;

INSERT INTO laboratorios (id, codigo, nombre, ubicacion, capacidad, descripcion, equipamiento, estado)
VALUES
  (1, 'LAB-01', 'Laboratorio de Desarrollo', 'Pabellón A · segundo nivel', 28,
   'Espacio para prácticas de programación, desarrollo web y proyectos de software.',
   'Computadoras, proyector, pizarra y red cableada', 'activo'),
  (2, 'LAB-02', 'Laboratorio de Redes', 'Pabellón A · primer nivel', 24,
   'Ambiente de aprendizaje para configuración de redes y soporte técnico.',
   'Computadoras, switches de práctica, proyector y pizarra', 'activo'),
  (3, 'LAB-03', 'Aula de Innovación', 'Pabellón B · tercer nivel', 20,
   'Espacio flexible para talleres, presentaciones y trabajo colaborativo.',
   'Computadoras, proyector, pantalla y mobiliario modular', 'activo')
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre), ubicacion = VALUES(ubicacion), capacidad = VALUES(capacidad),
  descripcion = VALUES(descripcion), equipamiento = VALUES(equipamiento), estado = VALUES(estado);

INSERT INTO solicitantes (id, nombres, apellidos, correo, tipo_solicitante)
VALUES
  (1, 'Ana Demo', 'Instructora', 'ana.demo@example.test', 'instructor'),
  (2, 'Usuario', 'Prueba', 'usuario.prueba@example.test', 'personal'),
  (3, 'Persona', 'Ejemplo', 'persona.ejemplo@example.test', 'instructor')
ON DUPLICATE KEY UPDATE
  nombres = VALUES(nombres), apellidos = VALUES(apellidos), tipo_solicitante = VALUES(tipo_solicitante);

INSERT INTO reservas
  (id, laboratorio_id, solicitante_id, fecha, hora_inicio, hora_fin, motivo, estado, observaciones)
VALUES
  (1, 1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', '11:00:00',
   'Práctica de desarrollo web', 'confirmada', 'Datos ficticios de demostración.'),
  (2, 2, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', '12:00:00',
   'Taller de fundamentos de redes', 'pendiente', 'Datos ficticios de demostración.')
ON DUPLICATE KEY UPDATE
  laboratorio_id = VALUES(laboratorio_id), solicitante_id = VALUES(solicitante_id),
  fecha = VALUES(fecha), hora_inicio = VALUES(hora_inicio), hora_fin = VALUES(hora_fin),
  motivo = VALUES(motivo), estado = VALUES(estado), observaciones = VALUES(observaciones);
