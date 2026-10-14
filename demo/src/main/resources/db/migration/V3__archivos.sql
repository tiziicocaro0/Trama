-- =====================================================================
-- TRAMA · V3 · Archivos (0.3, 4.3) y foto del niño
-- El contenido del archivo NO va en la base: está cifrado en disco (UPLOADS_DIR).
-- =====================================================================

CREATE TABLE archivo (
  id               BINARY(16)   NOT NULL,
  proyecto_id      BINARY(16)   NOT NULL,
  autor_id         BINARY(16)   NOT NULL,
  nombre_original  VARCHAR(255) NOT NULL,     -- solo para mostrar al descargar
  tipo_mime        VARCHAR(20)  NOT NULL,
  tamano_bytes     INT UNSIGNED NOT NULL,
  ruta             CHAR(36)     NOT NULL,     -- nombre UUID del archivo en disco
  fecha            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_archivo PRIMARY KEY (id),
  CONSTRAINT uq_archivo_ruta UNIQUE (ruta),
  CONSTRAINT fk_archivo_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyecto (id) ON DELETE CASCADE,
  CONSTRAINT fk_archivo_autor    FOREIGN KEY (autor_id)    REFERENCES usuario (id),
  CONSTRAINT ck_archivo_mime   CHECK (tipo_mime IN ('application/pdf','image/jpeg','image/png')),
  CONSTRAINT ck_archivo_tamano CHECK (tamano_bytes BETWEEN 1 AND 5242880),   -- máx. 5 MB
  INDEX ix_archivo_proyecto (proyecto_id, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE aporte_archivo (
  aporte_id   BINARY(16) NOT NULL,
  archivo_id  BINARY(16) NOT NULL,
  CONSTRAINT pk_aporte_archivo PRIMARY KEY (aporte_id, archivo_id),
  CONSTRAINT fk_aparch_aporte  FOREIGN KEY (aporte_id)  REFERENCES aporte (id)  ON DELETE CASCADE,
  CONSTRAINT fk_aparch_archivo FOREIGN KEY (archivo_id) REFERENCES archivo (id) ON DELETE CASCADE,
  INDEX ix_aparch_archivo (archivo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Foto del niño: referencia al archivo protegido, no una URL pública.
-- ON DELETE SET NULL es obligatorio: proyecto y archivo se referencian mutuamente, y sin él
-- borrar un proyecto con foto falla (error 1451). Probado en MySQL 8.0.
ALTER TABLE proyecto
  ADD CONSTRAINT fk_proyecto_foto FOREIGN KEY (foto_archivo_id) REFERENCES archivo (id) ON DELETE SET NULL;
