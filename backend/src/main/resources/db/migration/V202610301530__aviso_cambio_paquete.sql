-- =====================================================================
-- TRAMA · 9.3 · Aviso de cambio automático de paquete
-- Mientras no exista la campana de notificaciones (6.0), el aviso queda guardado en la
-- institución y la página /institucion lo muestra hasta que el responsable lo cierra.
-- =====================================================================

ALTER TABLE institucion
  ADD COLUMN aviso_paquete_anterior VARCHAR(40) NULL,
  ADD COLUMN aviso_motivo           VARCHAR(14) NULL,
  ADD CONSTRAINT ck_institucion_aviso_motivo CHECK (aviso_motivo IN ('NINOS','PROFESIONALES'));
