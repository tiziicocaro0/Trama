-- =====================================================================
-- TRAMA · V8 · Especialidad multi-selección
-- Reemplaza la columna simple membresia.especialidad por una tabla
-- que permite varias especialidades por membresía, cada una con
-- una aclaración opcional (subtítulo profesional).
-- =====================================================================

-- 1. Eliminar la restricción y la columna vieja.
ALTER TABLE membresia DROP CONSTRAINT ck_membresia_especialidad;
ALTER TABLE membresia DROP COLUMN especialidad;

-- 2. Tabla de especialidades por membresía (muchos-a-muchos).
CREATE TABLE membresia_especialidad (
  id            BINARY(16)   NOT NULL,
  membresia_id  BINARY(16)   NOT NULL,
  especialidad  VARCHAR(40)  NOT NULL,
  aclaracion    VARCHAR(120) NULL,
  CONSTRAINT pk_membresia_especialidad PRIMARY KEY (id),
  CONSTRAINT fk_mesp_membresia FOREIGN KEY (membresia_id)
      REFERENCES membresia (id) ON DELETE CASCADE,
  CONSTRAINT uq_mesp_membresia_esp UNIQUE (membresia_id, especialidad),
  CONSTRAINT ck_mesp_especialidad CHECK (especialidad IN (
      -- EDUCACION
      'DOCENTE_PRIMARIO','DOCENTE_SECUNDARIO','DOCENTE_EDUCACION_ESPECIAL',
      'MAESTRO_NIVEL_INICIAL','MAESTRA_INTEGRADORA','EQUIPO_ORIENTACION',
      'PRECEPTOR_ESCOLAR','DIRECTOR_ESCUELA','ASISTENTE_EDUCACIONAL',
      'INSPECTOR','OTRA_EDUCACION',
      -- SALUD
      'PSICOLOGIA','PSICOPEDAGOGIA','FONOAUDIOLOGIA','LOGOPEDA',
      'TERAPIA_OCUPACIONAL','ACOMPANANTE_TERAPEUTICO',
      'PSIQUIATRIA','PSIQUIATRIA_INFANTO_JUVENIL','PEDIATRIA',
      'GENETISTA','PSICOLOGO_SOCIAL','TRABAJADOR_SOCIAL',
      'OTRA_SALUD'
  )),
  INDEX ix_mesp_membresia (membresia_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
