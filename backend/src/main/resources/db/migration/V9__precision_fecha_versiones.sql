-- =====================================================================
-- TRAMA · V9 · Historial de versiones (3.2)
-- (V9 y no V8: la V8 es de la 1.9, especialidad multi-selección)
-- aporte_version.creado_en pasa de DATETIME (segundos) a DATETIME(6) (microsegundos):
-- si un aporte se edita dos veces en el mismo segundo, las versiones tienen que
-- seguir ordenándose bien en el historial.
-- =====================================================================

ALTER TABLE aporte_version
  MODIFY creado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
