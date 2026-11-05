-- Comprobante opcional de la matrícula (PDF, JPG o PNG): va cifrado en disco, como los
-- adjuntos. Solo existe si hay número de matrícula. TRAMA no lo verifica.
ALTER TABLE usuario
  ADD COLUMN matricula_comprobante_ruta CHAR(36)    NULL AFTER matricula,
  ADD COLUMN matricula_comprobante_tipo VARCHAR(20) NULL AFTER matricula_comprobante_ruta,
  ADD CONSTRAINT uq_usuario_comprobante_ruta UNIQUE (matricula_comprobante_ruta),
  ADD CONSTRAINT ck_usuario_comprobante_tipo
    CHECK (matricula_comprobante_tipo IN ('application/pdf','image/jpeg','image/png')),
  ADD CONSTRAINT ck_usuario_comprobante
    CHECK ((matricula_comprobante_ruta IS NULL) = (matricula_comprobante_tipo IS NULL)
           AND (matricula_comprobante_ruta IS NULL OR matricula IS NOT NULL));
