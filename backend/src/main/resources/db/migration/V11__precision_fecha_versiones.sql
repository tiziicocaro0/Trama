-- =====================================================================
-- TRAMA · V11 · Historial de versiones (3.2)
-- (V11: en develop la V9 es especialidad multi-selección y la V10 el límite de archivos de 5 MB)
-- aporte_version.creado_en pasa de DATETIME (segundos) a DATETIME(6) (microsegundos):
-- si un aporte se edita dos veces en el mismo segundo, las versiones tienen que
-- seguir ordenándose bien en el historial.
-- =====================================================================

ALTER TABLE aporte_version
  MODIFY creado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
