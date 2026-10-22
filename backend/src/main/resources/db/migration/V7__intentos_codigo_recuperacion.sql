-- 1.11: la recuperacion pasa a usar un codigo de 6 digitos.
-- Se cuentan los intentos fallidos para bloquear el codigo despues de 5.
ALTER TABLE token_recuperacion
  ADD COLUMN intentos INT NOT NULL DEFAULT 0;
