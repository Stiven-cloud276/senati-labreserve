USE bd_reservas_laboratorios_senati;

ALTER TABLE reservas
  ADD COLUMN usuario_id INT UNSIGNED NULL AFTER solicitante_id,
  ADD KEY idx_reservas_usuario (usuario_id),
  ADD CONSTRAINT fk_reservas_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE SET NULL;
