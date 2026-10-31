-- =====================================================================
-- TRAMA · Registro · Verificar el email con un código de 6 dígitos
-- Las cuentas que ya existían quedan verificadas.
-- =====================================================================

ALTER TABLE usuario
  ADD COLUMN email_verificado BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE codigo_verificacion (
  usuario_id   BINARY(16)       NOT NULL,
  codigo_hash  CHAR(64)         NOT NULL,
  vence_en     DATETIME(6)      NOT NULL,
  intentos     TINYINT UNSIGNED NOT NULL DEFAULT 0,
  creado_en    DATETIME(6)      NOT NULL,
  CONSTRAINT pk_codigo_verificacion PRIMARY KEY (usuario_id),
  CONSTRAINT fk_codver_usuario FOREIGN KEY (usuario_id)
      REFERENCES usuario (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
