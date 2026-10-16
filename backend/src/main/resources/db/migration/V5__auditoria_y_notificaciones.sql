-- =====================================================================
-- TRAMA · V5 · Registro de acciones (0.2, 8.0) y notificaciones (6.0, 6.1)
-- =====================================================================

CREATE TABLE registro_accion (
  id           BINARY(16)  NOT NULL,
  usuario_id   BINARY(16)  NOT NULL,
  proyecto_id  BINARY(16)  NOT NULL,
  accion       VARCHAR(10) NOT NULL,
  seccion      VARCHAR(30) NOT NULL,        -- sin contenido sensible
  fecha        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_registro_accion PRIMARY KEY (id),
  CONSTRAINT fk_registro_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuario (id),
  CONSTRAINT fk_registro_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyecto (id) ON DELETE CASCADE,
  CONSTRAINT ck_registro_accion CHECK (accion IN ('CREAR','EDITAR','ARCHIVAR','VER','INVITAR','REVOCAR','ELIMINAR')),
  INDEX ix_registro_proyecto_fecha (proyecto_id, fecha),            -- pantalla 8.0
  INDEX ix_registro_proyecto_usuario (proyecto_id, usuario_id, fecha) -- filtro por miembro
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE notificacion (
  id           BINARY(16)   NOT NULL,
  usuario_id   BINARY(16)   NOT NULL,
  proyecto_id  BINARY(16)   NULL,
  tipo         VARCHAR(20)  NOT NULL,
  texto        VARCHAR(255) NOT NULL,       -- sin contenido sensible: "Ana cargó una observación"
  link         VARCHAR(255) NOT NULL,
  leida        BOOLEAN      NOT NULL DEFAULT FALSE,
  fecha        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_notificacion PRIMARY KEY (id),
  CONSTRAINT fk_notif_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuario (id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyecto (id) ON DELETE CASCADE,
  INDEX ix_notif_campana (usuario_id, leida, fecha)                 -- campana cada 60 s
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE preferencia_notificacion (
  usuario_id  BINARY(16)  NOT NULL,
  tipo        VARCHAR(20) NOT NULL,
  por_email   BOOLEAN     NOT NULL DEFAULT TRUE,
  CONSTRAINT pk_preferencia PRIMARY KEY (usuario_id, tipo),
  CONSTRAINT fk_preferencia_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
