-- =====================================================================
-- TRAMA · 9.3 + 6.0 · El cambio automático de paquete se avisa con una
-- notificación al responsable: ya no hace falta guardar el aviso en la institución.
-- =====================================================================

ALTER TABLE institucion
  DROP CHECK ck_institucion_aviso_motivo,
  DROP COLUMN aviso_motivo,
  DROP COLUMN aviso_paquete_anterior;
