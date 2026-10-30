-- =====================================================================
-- TRAMA · 9.1 · Período de la suscripción del profesional (mensual o semestral)
-- El pago es simulado: no se guarda ningún dato de tarjeta.
-- =====================================================================

ALTER TABLE suscripcion
  ADD COLUMN periodo VARCHAR(10) NOT NULL DEFAULT 'MENSUAL',
  ADD CONSTRAINT ck_suscripcion_periodo CHECK (periodo IN ('MENSUAL','SEMESTRAL'));
