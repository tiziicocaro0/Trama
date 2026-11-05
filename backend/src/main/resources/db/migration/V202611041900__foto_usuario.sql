-- Foto de la cuenta (Mi perfil). Va cifrada en disco, como los archivos adjuntos;
-- acá solo queda el nombre del archivo y su tipo. La foto del niño ya existía:
-- proyecto.foto_archivo_id apunta a un archivo del propio proyecto.
ALTER TABLE usuario
  ADD COLUMN foto_ruta CHAR(36)    NULL AFTER matricula,
  ADD COLUMN foto_tipo VARCHAR(20) NULL AFTER foto_ruta,
  ADD CONSTRAINT uq_usuario_foto_ruta UNIQUE (foto_ruta),
  ADD CONSTRAINT ck_usuario_foto_tipo CHECK (foto_tipo IN ('image/jpeg','image/png')),
  ADD CONSTRAINT ck_usuario_foto CHECK ((foto_ruta IS NULL) = (foto_tipo IS NULL));
