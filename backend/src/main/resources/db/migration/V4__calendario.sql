-- =====================================================================
-- TRAMA · V4 · Calendario, reuniones y acuerdos (5.0 a 5.6)
-- Una reunión es un evento con tipo = 'REUNION' (5.5).
-- =====================================================================

CREATE TABLE evento (
  id                     BINARY(16)      NOT NULL,
  proyecto_id            BINARY(16)      NOT NULL,
  autor_id               BINARY(16)      NOT NULL,
  imagen_id              BINARY(16)      NULL,     -- pictograma del evento
  tipo                   VARCHAR(10)     NOT NULL DEFAULT 'COMUN',
  titulo                 VARCHAR(150)    NOT NULL,
  descripcion            VARBINARY(4096) NULL,     -- cifrado
  fecha                  DATE            NOT NULL, -- primera ocurrencia
  hora_inicio            TIME            NULL,
  hora_fin               TIME            NULL,
  recurrente             BOOLEAN         NOT NULL DEFAULT FALSE,
  dia_semana             TINYINT UNSIGNED NULL,    -- 1 = lunes ... 7 = domingo
  fecha_fin_recurrencia  DATE            NULL,
  es_cambio              BOOLEAN         NOT NULL DEFAULT FALSE,   -- 5.4 anticipar un cambio
  acta                   MEDIUMBLOB      NULL,     -- cifrado, solo reuniones
  creado_en              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_evento PRIMARY KEY (id),
  CONSTRAINT fk_evento_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyecto (id) ON DELETE CASCADE,
  CONSTRAINT fk_evento_autor    FOREIGN KEY (autor_id)    REFERENCES usuario (id),
  CONSTRAINT fk_evento_imagen   FOREIGN KEY (imagen_id)   REFERENCES archivo (id) ON DELETE SET NULL,
  CONSTRAINT ck_evento_tipo  CHECK (tipo IN ('COMUN','REUNION')),
  CONSTRAINT ck_evento_acta  CHECK (acta IS NULL OR tipo = 'REUNION'),
  CONSTRAINT ck_evento_horas CHECK (hora_fin IS NULL OR hora_inicio IS NULL OR hora_fin > hora_inicio),
  CONSTRAINT ck_evento_recurrencia CHECK (recurrente = FALSE OR (dia_semana IS NOT NULL AND dia_semana BETWEEN 1 AND 7)),  -- ojo: un CHECK con NULL pasa; por eso el IS NOT NULL
  INDEX ix_evento_calendario (proyecto_id, fecha)          -- GET eventos?desde=&hasta=
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE evento_excepcion (
  id                BINARY(16)   NOT NULL,
  evento_id         BINARY(16)   NOT NULL,
  fecha_ocurrencia  DATE         NOT NULL,
  cancelado         BOOLEAN      NOT NULL DEFAULT FALSE,
  titulo            VARCHAR(150) NULL,      -- NULL = sin cambios respecto del evento
  hora_inicio       TIME         NULL,
  hora_fin          TIME         NULL,
  CONSTRAINT pk_evento_excepcion PRIMARY KEY (id),
  CONSTRAINT uq_excepcion_ocurrencia UNIQUE (evento_id, fecha_ocurrencia),
  CONSTRAINT fk_excepcion_evento FOREIGN KEY (evento_id) REFERENCES evento (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE evento_participante (
  evento_id   BINARY(16) NOT NULL,
  usuario_id  BINARY(16) NOT NULL,
  CONSTRAINT pk_evento_participante PRIMARY KEY (evento_id, usuario_id),
  CONSTRAINT fk_participante_evento  FOREIGN KEY (evento_id)  REFERENCES evento (id) ON DELETE CASCADE,
  CONSTRAINT fk_participante_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
  INDEX ix_participante_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE acuerdo (
  id              BINARY(16)   NOT NULL,
  reunion_id      BINARY(16)   NOT NULL,    -- evento con tipo = 'REUNION' (lo valida el back)
  responsable_id  BINARY(16)   NOT NULL,
  descripcion     VARCHAR(500) NOT NULL,
  fecha_revision  DATE         NOT NULL,
  cumplido        BOOLEAN      NOT NULL DEFAULT FALSE,
  avisado_en      DATETIME     NULL,        -- para no notificar dos veces un acuerdo vencido
  CONSTRAINT pk_acuerdo PRIMARY KEY (id),
  CONSTRAINT fk_acuerdo_reunion     FOREIGN KEY (reunion_id)     REFERENCES evento (id) ON DELETE CASCADE,
  CONSTRAINT fk_acuerdo_responsable FOREIGN KEY (responsable_id) REFERENCES usuario (id),
  INDEX ix_acuerdo_vencimiento (cumplido, fecha_revision)  -- tarea diaria de avisos
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
