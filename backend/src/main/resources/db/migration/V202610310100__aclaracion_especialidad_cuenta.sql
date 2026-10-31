-- =====================================================================
-- TRAMA · 9.4 · Aclaración en las especialidades de la cuenta
-- Igual que en las membresías: para «Otra» la persona escribe qué hace.
-- =====================================================================

ALTER TABLE usuario_especialidad
  ADD COLUMN aclaracion VARCHAR(120) NULL;
