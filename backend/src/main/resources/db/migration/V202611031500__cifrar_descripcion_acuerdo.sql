-- 5.6: la descripción de un acuerdo es texto libre sobre el niño, así que va cifrada (como evento.descripcion)
ALTER TABLE acuerdo MODIFY descripcion VARBINARY(4096) NOT NULL;
