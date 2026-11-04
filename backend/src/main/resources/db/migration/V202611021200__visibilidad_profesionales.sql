ALTER TABLE aporte DROP CHECK ck_aporte_visibilidad;
ALTER TABLE aporte ADD CONSTRAINT ck_aporte_visibilidad
  CHECK (visibilidad IN ('TODOS', 'SOLO_TUTORES', 'SOLO_SALUD', 'SOLO_EDUCACION', 'PROFESIONALES'));
