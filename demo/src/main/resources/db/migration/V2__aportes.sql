-- =====================================================================
-- TRAMA · V2 · Aportes, versiones, confirmaciones, comentarios, revisiones
-- Historias: 3.0, 3.1, 3.2, 3.3, 3.4, 6.2
-- =====================================================================

CREATE TABLE aporte (
  id              BINARY(16)   NOT NULL,
  proyecto_id     BINARY(16)   NOT NULL,
  autor_id        BINARY(16)   NOT NULL,
  tipo            VARCHAR(30)  NOT NULL,     -- TipoAporte en Java (INTERES, FORTALEZA, OBSERVACION, NOTA_PROFESIONAL...)
  titulo          VARCHAR(150) NOT NULL,     -- sin cifrar: se muestra en listados y búsqueda rápida
  contenido       MEDIUMBLOB   NULL,         -- cifrado
  datos           MEDIUMBLOB   NULL,         -- cifrado (JSON con campos propios del tipo)
  visibilidad     VARCHAR(15)  NOT NULL DEFAULT 'TODOS',
  archivado       BOOLEAN      NOT NULL DEFAULT FALSE,
  creado_en       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_aporte PRIMARY KEY (id),
  CONSTRAINT fk_aporte_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyecto (id) ON DELETE CASCADE,
  CONSTRAINT fk_aporte_autor    FOREIGN KEY (autor_id)    REFERENCES usuario (id),
  CONSTRAINT ck_aporte_visibilidad CHECK (visibilidad IN ('TODOS','SOLO_TUTORES','SOLO_SALUD','SOLO_EDUCACION')),
  INDEX ix_aporte_seccion (proyecto_id, tipo, archivado, creado_en),   -- cada sección del perfil y la portada
  INDEX ix_aporte_autor (autor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE aporte_version (
  id         BINARY(16)   NOT NULL,
  aporte_id  BINARY(16)   NOT NULL,
  autor_id   BINARY(16)   NOT NULL,
  titulo     VARCHAR(150) NOT NULL,
  contenido  MEDIUMBLOB   NULL,              -- cifrado
  datos      MEDIUMBLOB   NULL,              -- cifrado
  creado_en  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_aporte_version PRIMARY KEY (id),
  CONSTRAINT fk_version_aporte FOREIGN KEY (aporte_id) REFERENCES aporte (id) ON DELETE CASCADE,
  CONSTRAINT fk_version_autor  FOREIGN KEY (autor_id)  REFERENCES usuario (id),
  INDEX ix_version_aporte (aporte_id, creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE confirmacion_aporte (
  aporte_id   BINARY(16) NOT NULL,
  usuario_id  BINARY(16) NOT NULL,
  fecha       DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_confirmacion PRIMARY KEY (aporte_id, usuario_id),     -- una por persona
  CONSTRAINT fk_confirmacion_aporte  FOREIGN KEY (aporte_id)  REFERENCES aporte (id) ON DELETE CASCADE,
  CONSTRAINT fk_confirmacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE comentario (
  id         BINARY(16)      NOT NULL,
  aporte_id  BINARY(16)      NOT NULL,
  autor_id   BINARY(16)      NOT NULL,
  texto      VARBINARY(4096) NOT NULL,       -- cifrado
  fecha      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_comentario PRIMARY KEY (id),
  CONSTRAINT fk_comentario_aporte FOREIGN KEY (aporte_id) REFERENCES aporte (id) ON DELETE CASCADE,
  CONSTRAINT fk_comentario_autor  FOREIGN KEY (autor_id)  REFERENCES usuario (id),
  INDEX ix_comentario_aporte (aporte_id, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE solicitud_revision (
  id              BINARY(16)      NOT NULL,
  aporte_id       BINARY(16)      NOT NULL,
  solicitante_id  BINARY(16)      NOT NULL,
  motivo          VARBINARY(4096) NOT NULL,  -- cifrado
  estado          VARCHAR(10)     NOT NULL DEFAULT 'PENDIENTE',
  fecha           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_solicitud_revision PRIMARY KEY (id),
  CONSTRAINT fk_revision_aporte      FOREIGN KEY (aporte_id)      REFERENCES aporte (id) ON DELETE CASCADE,
  CONSTRAINT fk_revision_solicitante FOREIGN KEY (solicitante_id) REFERENCES usuario (id),
  CONSTRAINT ck_revision_estado CHECK (estado IN ('PENDIENTE','REVISADA')),
  INDEX ix_revision_aporte (aporte_id, estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
