-- 1.9: Restringir los valores validos de especialidad en membresia.
-- La columna y el CHECK de rol ya existen en V1; esta migracion agrega la validacion de valores.

ALTER TABLE membresia
  ADD CONSTRAINT ck_membresia_especialidad_val
    CHECK (
      especialidad IS NULL
      OR especialidad IN (
        'DOCENTE',
        'MAESTRA_INTEGRADORA',
        'EQUIPO_ORIENTACION',
        'PSICOLOGIA',
        'PSICOPEDAGOGIA',
        'FONOAUDIOLOGIA',
        'TERAPIA_OCUPACIONAL',
        'ACOMPANANTE_TERAPEUTICO',
        'OTRA'
      )
    );
