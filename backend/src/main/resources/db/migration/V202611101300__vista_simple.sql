-- 7.0: la vista simple (menos opciones y textos grandes) es una preferencia de la cuenta,
-- así se mantiene al volver a entrar desde cualquier dispositivo.
ALTER TABLE usuario
  ADD COLUMN vista_simple BOOLEAN NOT NULL DEFAULT FALSE AFTER foto_tipo;
