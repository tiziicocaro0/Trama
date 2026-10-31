-- 3.3: confirmar un aporte ajeno y quitar la confirmación quedan en la auditoría (0.2)
-- La columna pasa a 20 caracteres: QUITAR_CONFIRMACION no entra en 10.
ALTER TABLE registro_accion MODIFY accion VARCHAR(20) NOT NULL;
ALTER TABLE registro_accion DROP CHECK ck_registro_accion;
ALTER TABLE registro_accion ADD CONSTRAINT ck_registro_accion
  CHECK (accion IN ('CREAR','EDITAR','ARCHIVAR','VER','INVITAR','REVOCAR','ELIMINAR',
                    'CONFIRMAR','QUITAR_CONFIRMACION'));
