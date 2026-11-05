-- La matrícula es de la persona, no de cada niño: el profesional la declara una vez
-- (al registrarse o desde Mi perfil) y la ve toda su red. TRAMA no la verifica.
-- Solo la tienen las cuentas profesionales.
ALTER TABLE usuario
  ADD COLUMN matricula VARCHAR(40) NULL AFTER tipo_cuenta,
  ADD CONSTRAINT ck_usuario_matricula CHECK (matricula IS NULL OR tipo_cuenta = 'PROFESIONAL');
