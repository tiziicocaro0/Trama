-- =====================================================================
-- TRAMA · Datos mock para desarrollo (historia 0.12)
-- NO es una migración: se carga solo en dev / demo, nunca en una base real.
-- Personas ficticias basadas en nuestras user personas (María, Diego, Marta).
-- Contraseña de todos los usuarios: Trama1234!   (hash BCrypt $2a$10)
--
-- Importante: el contenido de los aportes va cifrado con la clave de cada entorno,
-- así que este script solo carga títulos (contenido y datos en NULL).
-- El texto cifrado lo completa el DataSeeder en Java, que sí tiene la clave.
-- Los ids son fijos para que los tests y el front puedan usarlos.
-- =====================================================================

SET @pass = '$2a$10$cS5Gib6wIgeYgyeNmIEe0O6CB0K3DXCJinvT/hIJCZDMQuOAy77kq';

-- ---------- Usuarios ----------
SET @u_tutor     = UUID_TO_BIN('00000000-0000-4000-8000-000000000001');
SET @u_cotutor   = UUID_TO_BIN('00000000-0000-4000-8000-000000000002');
SET @u_familiar  = UUID_TO_BIN('00000000-0000-4000-8000-000000000003');
SET @u_docente   = UUID_TO_BIN('00000000-0000-4000-8000-000000000004');
SET @u_psico     = UUID_TO_BIN('00000000-0000-4000-8000-000000000005');
SET @u_tut_valen = UUID_TO_BIN('00000000-0000-4000-8000-000000000006');
SET @u_tut_juli  = UUID_TO_BIN('00000000-0000-4000-8000-000000000007');
SET @u_nuevo     = UUID_TO_BIN('00000000-0000-4000-8000-000000000008');

INSERT INTO usuario (id, nombre, apellido, email, password_hash) VALUES
  (@u_tutor,     'Marta',  'Fernández', 'tutor@trama.test',       @pass),  -- persona: madre de Tomi
  (@u_cotutor,   'Jorge',  'Fernández', 'cotutor@trama.test',     @pass),  -- padre de Tomi (co-tutor)
  (@u_familiar,  'Elena',  'Sosa',      'familiar@trama.test',    @pass),  -- abuela de Tomi: un solo proyecto
  (@u_docente,   'María',  'Díaz',      'docente@trama.test',     @pass),  -- persona: docente de primaria
  (@u_psico,     'Diego',  'Torres',    'psico@trama.test',       @pass),  -- persona: psicólogo, 3 niños (freemium)
  (@u_tut_valen, 'Laura',  'Ruiz',      'tutora.valen@trama.test',@pass),
  (@u_tut_juli,  'Pablo',  'Gómez',     'tutor.juli@trama.test',  @pass),
  (@u_nuevo,     'Sofía',  'Nueva',     'nuevo@trama.test',       @pass);  -- sin proyectos: "Mis proyectos" vacío

-- ---------- Proyectos (niños) ----------
SET @p_tomi  = UUID_TO_BIN('00000000-0000-4000-9000-000000000001');
SET @p_valen = UUID_TO_BIN('00000000-0000-4000-9000-000000000002');
SET @p_juli  = UUID_TO_BIN('00000000-0000-4000-9000-000000000003');

INSERT INTO proyecto (id, nombre, apellido, apodo, fecha_nacimiento, escuela, grado, consentimiento_fecha) VALUES
  (@p_tomi,  'Tomás',     'Fernández', 'Tomi',  '2017-05-12', 'Escuela N.º 12 D.E. 4', '3.º grado', '2026-10-07 10:00:00'),
  (@p_valen, 'Valentina', 'Ruiz',      'Valen', '2018-09-03', 'Instituto San Martín',  '2.º grado', '2026-10-07 11:00:00'),
  (@p_juli,  'Julián',    'Gómez',     'Juli',  '2016-02-20', 'Escuela N.º 7 D.E. 9',  '4.º grado', '2026-10-07 12:00:00');

-- ---------- Membresías ----------
-- Cubren los 3 casos de "Mis proyectos" (1.10): varios (psico), uno solo (familiar), ninguno (nuevo).
-- Diego (psico) está en 3 niños: en el 3.º queda en solo lectura con el plan gratuito (9.0).
INSERT INTO membresia (id, usuario_id, proyecto_id, rol, es_admin, especialidad, matricula, fecha_alta) VALUES
  (UUID_TO_BIN(UUID()), @u_tutor,     @p_tomi,  'TUTOR',     TRUE,  NULL,          NULL,       '2026-10-07 10:00:00'),
  (UUID_TO_BIN(UUID()), @u_cotutor,   @p_tomi,  'TUTOR',     TRUE,  NULL,          NULL,       '2026-10-07 10:05:00'),
  (UUID_TO_BIN(UUID()), @u_familiar,  @p_tomi,  'FAMILIAR',  FALSE, NULL,          NULL,       '2026-10-07 10:10:00'),
  (UUID_TO_BIN(UUID()), @u_docente,   @p_tomi,  'EDUCACION', FALSE, 'DOCENTE',     NULL,       '2026-10-07 10:15:00'),
  (UUID_TO_BIN(UUID()), @u_psico,     @p_tomi,  'SALUD',     FALSE, 'PSICOLOGIA',  'MN 12345', '2026-10-07 10:20:00'),
  (UUID_TO_BIN(UUID()), @u_tut_valen, @p_valen, 'TUTOR',     TRUE,  NULL,          NULL,       '2026-10-07 11:00:00'),
  (UUID_TO_BIN(UUID()), @u_docente,   @p_valen, 'EDUCACION', FALSE, 'DOCENTE',     NULL,       '2026-10-07 11:10:00'),
  (UUID_TO_BIN(UUID()), @u_psico,     @p_valen, 'SALUD',     FALSE, 'PSICOLOGIA',  'MN 12345', '2026-10-07 11:20:00'),
  (UUID_TO_BIN(UUID()), @u_tut_juli,  @p_juli,  'TUTOR',     TRUE,  NULL,          NULL,       '2026-10-07 12:00:00'),
  (UUID_TO_BIN(UUID()), @u_psico,     @p_juli,  'SALUD',     FALSE, 'PSICOLOGIA',  'MN 12345', '2026-10-07 12:20:00');

-- ---------- Invitación pendiente (1.3 / 1.4) ----------
-- Token en claro para probar: invitacion-demo-tomi  ->  /invitacion/invitacion-demo-tomi
INSERT INTO invitacion (id, proyecto_id, invitado_por, email, rol, token_hash, vence_en) VALUES
  (UUID_TO_BIN(UUID()), @p_tomi, @u_tutor, 'fono@trama.test', 'SALUD',
   '43ba5181b89aee5fa32eb686fb5c9ae71294787c9a2cd50b0f62b9562647f71f', NOW() + INTERVAL 7 DAY);

-- ---------- Aportes de Tomi (solo títulos; el contenido cifrado lo agrega el DataSeeder) ----------
-- Tomados de la diapositiva "Perfil del niño" de la presentación.
INSERT INTO aporte (id, proyecto_id, autor_id, tipo, titulo, visibilidad) VALUES
  (UUID_TO_BIN(UUID()), @p_tomi, @u_tutor,   'INTERES',          'Trenes',                                 'TODOS'),
  (UUID_TO_BIN(UUID()), @p_tomi, @u_familiar,'INTERES',          'Música',                                 'TODOS'),
  (UUID_TO_BIN(UUID()), @p_tomi, @u_docente, 'FORTALEZA',        'Patrones y números',                     'TODOS'),
  (UUID_TO_BIN(UUID()), @p_tomi, @u_psico,   'COMUNICACION',     'Pictogramas y palabras clave',           'TODOS'),
  (UUID_TO_BIN(UUID()), @p_tomi, @u_docente, 'ESTRATEGIA',       'Temporizador visual y espacio tranquilo','TODOS'),
  (UUID_TO_BIN(UUID()), @p_tomi, @u_tutor,   'RUTINA',           'Agenda visual para anticipar cambios',   'TODOS'),
  (UUID_TO_BIN(UUID()), @p_tomi, @u_psico,   'NOTA_PROFESIONAL', 'Orientación para el aula',               'SOLO_SALUD');  -- prueba la 3.1

-- ---------- Calendario de Tomi ----------
SET @e_reunion = UUID_TO_BIN(UUID());
INSERT INTO evento (id, proyecto_id, autor_id, tipo, titulo, fecha, hora_inicio, hora_fin, recurrente, dia_semana, fecha_fin_recurrencia, es_cambio) VALUES
  (UUID_TO_BIN(UUID()), @p_tomi, @u_tutor,   'COMUN',   'Natación',                    '2026-10-13', '17:00', '18:00', TRUE,  2, '2026-12-15', FALSE),
  (UUID_TO_BIN(UUID()), @p_tomi, @u_docente, 'COMUN',   'Acto escolar (cambio de horario)', '2026-10-20', '09:00', '11:00', FALSE, NULL, NULL, TRUE),
  (@e_reunion,          @p_tomi, @u_tutor,   'REUNION', 'Reunión de red',              '2026-10-23', '18:00', '19:00', FALSE, NULL, NULL, FALSE);

INSERT INTO evento_participante (evento_id, usuario_id) VALUES
  (@e_reunion, @u_tutor), (@e_reunion, @u_docente), (@e_reunion, @u_psico);

-- ---------- Paquetes institucionales (9.2) ----------
-- Cupos y precios a definir en la 0.13 (Santiago y Máximo): por ahora en 0.
INSERT INTO paquete (id, nombre, cupo_ninos, cupo_profesionales, precio) VALUES
  (UUID_TO_BIN(UUID()), 'Inicial',  10,  5, 0.00),
  (UUID_TO_BIN(UUID()), 'Escuela',  40, 15, 0.00),
  (UUID_TO_BIN(UUID()), 'Centro',  100, 40, 0.00);
