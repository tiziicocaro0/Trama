-- =====================================================================
-- TRAMA · V6 · Planes y licencias (9.0 a 9.3) · el pago es simulado
-- =====================================================================

CREATE TABLE suscripcion (
  usuario_id  BINARY(16) NOT NULL,
  activa      BOOLEAN    NOT NULL DEFAULT TRUE,
  desde       DATE       NOT NULL,
  hasta       DATE       NULL,
  CONSTRAINT pk_suscripcion PRIMARY KEY (usuario_id),
  CONSTRAINT fk_suscripcion_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE paquete (
  id                  BINARY(16)    NOT NULL,
  nombre              VARCHAR(40)   NOT NULL,
  cupo_ninos          SMALLINT UNSIGNED NOT NULL,
  cupo_profesionales  SMALLINT UNSIGNED NOT NULL,
  precio              DECIMAL(10,2) NOT NULL,
  CONSTRAINT pk_paquete PRIMARY KEY (id),
  CONSTRAINT uq_paquete_nombre UNIQUE (nombre),
  CONSTRAINT ck_paquete_precio CHECK (precio >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE institucion (
  id              BINARY(16)   NOT NULL,
  paquete_id      BINARY(16)   NOT NULL,
  responsable_id  BINARY(16)   NOT NULL,
  nombre          VARCHAR(120) NOT NULL,
  CONSTRAINT pk_institucion PRIMARY KEY (id),
  CONSTRAINT fk_institucion_paquete     FOREIGN KEY (paquete_id)     REFERENCES paquete (id),
  CONSTRAINT fk_institucion_responsable FOREIGN KEY (responsable_id) REFERENCES usuario (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE licencia_profesional (
  id              BINARY(16) NOT NULL,
  institucion_id  BINARY(16) NOT NULL,
  usuario_id      BINARY(16) NOT NULL,
  desde           DATE       NOT NULL,
  hasta           DATE       NULL,
  CONSTRAINT pk_licencia PRIMARY KEY (id),
  CONSTRAINT uq_licencia UNIQUE (institucion_id, usuario_id),
  CONSTRAINT fk_licencia_institucion FOREIGN KEY (institucion_id) REFERENCES institucion (id) ON DELETE CASCADE,
  CONSTRAINT fk_licencia_usuario     FOREIGN KEY (usuario_id)     REFERENCES usuario (id),
  INDEX ix_licencia_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
