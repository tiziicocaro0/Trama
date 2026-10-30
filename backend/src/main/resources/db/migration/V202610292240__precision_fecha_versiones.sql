-- =====================================================================
-- TRAMA · Historial de versiones (3.2)
-- Nombre con fecha (formato de CONTEXTO.md): tiene que ser posterior a la última
-- migración de develop (V202610282010, límite de archivos de 5 MB) para que Flyway
-- la acepte en las bases que ya la tienen aplicada.
-- aporte_version.creado_en pasa de DATETIME (segundos) a DATETIME(6) (microsegundos):
-- si un aporte se edita dos veces en el mismo segundo, las versiones tienen que
-- seguir ordenándose bien en el historial.
-- =====================================================================

ALTER TABLE aporte_version
  MODIFY creado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
