-- =====================================================================
-- TRAMA · 9.4 · Tipo de cuenta y especialidades declaradas al registrarse
-- La cuenta dice cómo usa Trama la persona (familia o profesional).
-- El rol en cada niño lo sigue fijando la invitación; las especialidades
-- de la cuenta solo sirven para precargar las de cada membresía.
-- =====================================================================

ALTER TABLE usuario
  ADD COLUMN tipo_cuenta VARCHAR(12) NOT NULL DEFAULT 'FAMILIA',
  ADD CONSTRAINT ck_usuario_tipo_cuenta CHECK (tipo_cuenta IN ('FAMILIA','PROFESIONAL'));

CREATE TABLE usuario_especialidad (
  id            BINARY(16)   NOT NULL,
  usuario_id    BINARY(16)   NOT NULL,
  especialidad  VARCHAR(40)  NOT NULL,
  CONSTRAINT pk_usuario_especialidad PRIMARY KEY (id),
  CONSTRAINT fk_uesp_usuario FOREIGN KEY (usuario_id)
      REFERENCES usuario (id) ON DELETE CASCADE,
  CONSTRAINT uq_uesp_usuario_esp UNIQUE (usuario_id, especialidad),
  CONSTRAINT ck_uesp_especialidad CHECK (especialidad IN (
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
  ))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Cuentas que ya existían: quien trabaja como educación o salud en algún niño
-- pasa a profesional y hereda las especialidades que declaró en sus membresías.
UPDATE usuario u
   SET u.tipo_cuenta = 'PROFESIONAL'
 WHERE EXISTS (SELECT 1 FROM membresia m
                WHERE m.usuario_id = u.id AND m.rol IN ('EDUCACION','SALUD'));

INSERT INTO usuario_especialidad (id, usuario_id, especialidad)
SELECT UUID_TO_BIN(UUID()), d.usuario_id, d.especialidad
  FROM (SELECT DISTINCT m.usuario_id, me.especialidad
          FROM membresia_especialidad me
          JOIN membresia m ON m.id = me.membresia_id) d;
