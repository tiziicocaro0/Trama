-- =====================================================================
-- TRAMA · V1 · Núcleo: usuarios, proyectos (niños), membresías, invitaciones
-- MySQL 8.0 · InnoDB · utf8mb4
-- Convenciones:
--   * Todas las PK son UUID en BINARY(16), generados por el back (UUID.randomUUID()).
--   * Los "enum" se guardan como VARCHAR + CHECK, mapeados con @Enumerated(STRING) en JPA.
--   * Fechas con hora en DATETIME (UTC, lo maneja el back).
--   * Columnas cifradas (AES-256-GCM, historia 0.20) en VARBINARY / MEDIUMBLOB.
-- =====================================================================

CREATE TABLE usuario (
  id                 BINARY(16)    NOT NULL,
  nombre             VARCHAR(80)   NOT NULL,
  apellido           VARCHAR(80)   NOT NULL,
  email              VARCHAR(254)  NOT NULL,
  password_hash      CHAR(60)      NOT NULL,                 -- BCrypt
  intentos_fallidos  TINYINT UNSIGNED NOT NULL DEFAULT 0,     -- 1.1 bloqueo tras 5
  bloqueado_hasta    DATETIME      NULL,
  token_version      INT UNSIGNED  NOT NULL DEFAULT 0,        -- invalida JWT viejos
  fecha_alta         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_usuario PRIMARY KEY (id),
  CONSTRAINT uq_usuario_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE token_recuperacion (
  id          BINARY(16) NOT NULL,
  usuario_id  BINARY(16) NOT NULL,
  token_hash  CHAR(64)   NOT NULL,                            -- SHA-256 en hex
  vence_en    DATETIME   NOT NULL,
  usado_en    DATETIME   NULL,
  creado_en   DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_token_recuperacion PRIMARY KEY (id),
  CONSTRAINT uq_token_recuperacion_hash UNIQUE (token_hash),
  CONSTRAINT fk_tokrec_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE proyecto (
  id                      BINARY(16)   NOT NULL,
  nombre                  VARCHAR(80)  NOT NULL,
  apellido                VARCHAR(80)  NOT NULL,
  apodo                   VARCHAR(40)  NULL,
  fecha_nacimiento        DATE         NOT NULL,
  escuela                 VARCHAR(120) NOT NULL,
  grado                   VARCHAR(30)  NOT NULL,
  foto_archivo_id         BINARY(16)   NULL,                  -- FK se agrega en V3 (archivo)
  consentimiento_fecha    DATETIME     NOT NULL,              -- 1.2
  familiar_puede_cargar   BOOLEAN      NOT NULL DEFAULT TRUE, -- 1.8
  familiar_ve_notas       BOOLEAN      NOT NULL DEFAULT FALSE,-- 1.8
  eliminacion_programada  DATETIME     NULL,                  -- 8.2 (NULL = sin pedido)
  eliminacion_pedida_por  BINARY(16)   NULL,
  creado_en               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_proyecto PRIMARY KEY (id),
  CONSTRAINT fk_proyecto_elim_usuario FOREIGN KEY (eliminacion_pedida_por) REFERENCES usuario (id) ON DELETE SET NULL,
  INDEX ix_proyecto_eliminacion (eliminacion_programada)     -- tarea diaria de la 8.2
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE membresia (
  id           BINARY(16)  NOT NULL,
  usuario_id   BINARY(16)  NOT NULL,
  proyecto_id  BINARY(16)  NOT NULL,
  rol          VARCHAR(12) NOT NULL,
  es_admin     BOOLEAN     NOT NULL DEFAULT FALSE,
  especialidad VARCHAR(30) NULL,                              -- 1.9, solo EDUCACION / SALUD
  matricula    VARCHAR(40) NULL,
  fecha_alta   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_membresia PRIMARY KEY (id),
  CONSTRAINT uq_membresia_usuario_proyecto UNIQUE (usuario_id, proyecto_id),  -- un rol por niño
  CONSTRAINT fk_membresia_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuario (id),
  CONSTRAINT fk_membresia_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyecto (id) ON DELETE CASCADE,
  CONSTRAINT ck_membresia_rol CHECK (rol IN ('TUTOR','FAMILIAR','EDUCACION','SALUD')),
  CONSTRAINT ck_membresia_admin CHECK (es_admin = FALSE OR rol = 'TUTOR'),
  CONSTRAINT ck_membresia_especialidad CHECK (especialidad IS NULL OR rol IN ('EDUCACION','SALUD')),
  INDEX ix_membresia_proyecto (proyecto_id, rol)             -- "miembros de este niño"
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE invitacion (
  id            BINARY(16)   NOT NULL,
  proyecto_id   BINARY(16)   NOT NULL,
  invitado_por  BINARY(16)   NOT NULL,
  email         VARCHAR(254) NOT NULL,
  rol           VARCHAR(12)  NOT NULL,
  token_hash    CHAR(64)     NOT NULL,                        -- se guarda el hash, no el token
  vence_en      DATETIME     NOT NULL,                        -- creado + 7 días
  estado        VARCHAR(10)  NOT NULL DEFAULT 'PENDIENTE',
  creado_en     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_invitacion PRIMARY KEY (id),
  CONSTRAINT uq_invitacion_token UNIQUE (token_hash),
  CONSTRAINT fk_invitacion_proyecto FOREIGN KEY (proyecto_id)  REFERENCES proyecto (id) ON DELETE CASCADE,
  CONSTRAINT fk_invitacion_usuario  FOREIGN KEY (invitado_por) REFERENCES usuario (id),
  CONSTRAINT ck_invitacion_rol    CHECK (rol IN ('TUTOR','FAMILIAR','EDUCACION','SALUD')),
  CONSTRAINT ck_invitacion_estado CHECK (estado IN ('PENDIENTE','ACEPTADA','VENCIDA','CANCELADA')),
  INDEX ix_invitacion_proyecto (proyecto_id, estado)         -- invitaciones pendientes (1.3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
