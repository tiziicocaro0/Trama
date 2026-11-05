-- A qué tipo de escuela va el niño: común, especial o híbrida (concurre a las dos).
-- Queda NULL en los perfiles creados antes: el front lo pide al crear y al editar.
ALTER TABLE proyecto
  ADD COLUMN tipo_escuela VARCHAR(10) NULL AFTER escuela,
  ADD CONSTRAINT ck_proyecto_tipo_escuela CHECK (tipo_escuela IN ('COMUN','ESPECIAL','HIBRIDA'));
