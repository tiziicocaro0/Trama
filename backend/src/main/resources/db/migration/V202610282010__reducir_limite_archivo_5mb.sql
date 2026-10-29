-- =====================================================================
-- TRAMA · Volver el límite de archivo adjunto a 5 MB (4.3)
-- V8 lo había subido a 20 MB: es demasiado y satura el disco y la
-- memoria del servidor al cifrar y descifrar. El límite único vive en
-- ArchivoService.TAMANO_MAXIMO_BYTES (lo verifica LimiteTamanoArchivoTest).
-- =====================================================================

ALTER TABLE archivo
  DROP CHECK ck_archivo_tamano,
  ADD CONSTRAINT ck_archivo_tamano CHECK (tamano_bytes BETWEEN 1 AND 5242880);
