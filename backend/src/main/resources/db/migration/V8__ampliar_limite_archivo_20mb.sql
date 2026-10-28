-- =====================================================================
-- TRAMA · V8 · Ampliar límite de tamaño de archivo adjunto a 20 MB (4.3)
-- =====================================================================

ALTER TABLE archivo
  DROP CHECK ck_archivo_tamano,
  ADD CONSTRAINT ck_archivo_tamano CHECK (tamano_bytes BETWEEN 1 AND 20971520);

