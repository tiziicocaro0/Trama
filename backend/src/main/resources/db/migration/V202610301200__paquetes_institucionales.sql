-- =====================================================================
-- TRAMA · 9.2 · Paquetes institucionales
-- - Cupo NULL = sin límite (lo usa el último paquete, 9.3).
-- - Un usuario es responsable de una sola institución.
-- - Paquetes de la planilla de costos (0.13). Precios en pesos; el pago es simulado.
-- =====================================================================

ALTER TABLE paquete
  MODIFY cupo_ninos         SMALLINT UNSIGNED NULL,
  MODIFY cupo_profesionales SMALLINT UNSIGNED NULL;

ALTER TABLE institucion
  ADD CONSTRAINT uq_institucion_responsable UNIQUE (responsable_id);

INSERT INTO paquete (id, nombre, cupo_ninos, cupo_profesionales, precio) VALUES
  (UUID_TO_BIN(UUID()), 'Inicial',    15,   5,    18000.00),
  (UUID_TO_BIN(UUID()), 'Intermedio', 40,   15,   45000.00),
  (UUID_TO_BIN(UUID()), 'Red',        NULL, NULL, 90000.00);
