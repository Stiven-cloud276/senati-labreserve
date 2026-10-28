CREATE DATABASE IF NOT EXISTS bd_reservas_laboratorios_senati
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bd_reservas_laboratorios_senati;

CREATE TABLE IF NOT EXISTS laboratorios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(20) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  ubicacion VARCHAR(120) NOT NULL,
  capacidad SMALLINT UNSIGNED NOT NULL,
  descripcion VARCHAR(500) NULL,
  equipamiento VARCHAR(500) NULL,
  estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_laboratorios_codigo (codigo),
  CONSTRAINT chk_laboratorios_capacidad CHECK (capacidad > 0),
  KEY idx_laboratorios_estado (estado)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS solicitantes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombres VARCHAR(80) NOT NULL,
  apellidos VARCHAR(80) NOT NULL,
  correo VARCHAR(160) NOT NULL,
  tipo_solicitante ENUM('instructor', 'personal', 'otro') NOT NULL DEFAULT 'otro',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_solicitantes_correo (correo),
  KEY idx_solicitantes_nombre (apellidos, nombres)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reservas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  laboratorio_id INT UNSIGNED NOT NULL,
  solicitante_id INT UNSIGNED NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  motivo VARCHAR(180) NOT NULL,
  estado ENUM('pendiente', 'confirmada', 'cancelada') NOT NULL DEFAULT 'pendiente',
  observaciones VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_reservas_laboratorio FOREIGN KEY (laboratorio_id)
    REFERENCES laboratorios (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_reservas_solicitante FOREIGN KEY (solicitante_id)
    REFERENCES solicitantes (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_reservas_horario CHECK (hora_fin > hora_inicio),
  KEY idx_reservas_laboratorio_fecha_estado (laboratorio_id, fecha, estado),
  KEY idx_reservas_solicitante (solicitante_id),
  KEY idx_reservas_fecha_estado (fecha, estado)
) ENGINE=InnoDB;
