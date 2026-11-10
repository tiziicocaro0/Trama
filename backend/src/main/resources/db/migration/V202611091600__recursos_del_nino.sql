-- TRAMA · Recursos del niño
-- Archivos (PDF o fotos) que se suben directo a la pestaña Recursos del perfil.
-- visibilidad NULL = archivo que vive en otro lado (adjunto de un aporte, imagen de un
-- evento o foto del niño): esos siguen las reglas de donde están.
-- Como los aportes, un recurso no se borra: se archiva.

ALTER TABLE archivo
  ADD COLUMN visibilidad VARCHAR(20) NULL AFTER ruta,
  ADD COLUMN archivado   BOOLEAN     NOT NULL DEFAULT FALSE AFTER visibilidad,
  ADD CONSTRAINT ck_archivo_visibilidad CHECK (
    visibilidad IS NULL
    OR visibilidad IN ('TODOS','SOLO_TUTORES','SOLO_SALUD','SOLO_EDUCACION','PROFESIONALES')
  );

CREATE INDEX idx_archivo_recursos ON archivo (proyecto_id, archivado);
