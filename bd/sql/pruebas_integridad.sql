-- =====================================================================
-- TRAMA · Pruebas de integridad de la base (sin back, sin Spring)
-- Uso: correr V1..V6 + datos_mock_dev.sql en una base vacía y después este script.
--   mysql -u root trama < pruebas_integridad.sql
-- Cada prueba dice si la base RECHAZA lo que tiene que rechazar (o acepta lo que debe).
-- Todo corre dentro de una transacción que se deshace al final: no deja cambios.
-- =====================================================================

DROP TEMPORARY TABLE IF EXISTS resultado;
CREATE TEMPORARY TABLE resultado (n INT AUTO_INCREMENT PRIMARY KEY, prueba VARCHAR(120), esperado VARCHAR(10), obtenido VARCHAR(10), ok CHAR(2)) ENGINE=MEMORY;  -- MEMORY: no se deshace con el ROLLBACK

DROP PROCEDURE IF EXISTS probar;
DELIMITER //
CREATE PROCEDURE probar(IN p_nombre VARCHAR(120), IN p_sql TEXT, IN p_debe_fallar BOOLEAN)
BEGIN
  DECLARE fallo BOOLEAN DEFAULT FALSE;
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET fallo = TRUE;
  SET @q = p_sql;
  PREPARE st FROM @q; EXECUTE st; DEALLOCATE PREPARE st;
  INSERT INTO resultado (prueba, esperado, obtenido, ok)
  VALUES (p_nombre, IF(p_debe_fallar,'rechaza','acepta'), IF(fallo,'rechaza','acepta'), IF(fallo = p_debe_fallar,'OK','XX'));
END //
DELIMITER ;

SET @u_tutor   = UUID_TO_BIN('00000000-0000-4000-8000-000000000001');
SET @u_familiar= UUID_TO_BIN('00000000-0000-4000-8000-000000000003');
SET @u_psico   = UUID_TO_BIN('00000000-0000-4000-8000-000000000005');
SET @p_tomi    = UUID_TO_BIN('00000000-0000-4000-9000-000000000001');
SET @p_juli    = UUID_TO_BIN('00000000-0000-4000-9000-000000000003');
SET @fantasma  = UUID_TO_BIN(UUID());
SET @a1 = (SELECT id FROM aporte WHERE proyecto_id = @p_tomi ORDER BY titulo LIMIT 1);

START TRANSACTION;

-- Usuarios
CALL probar('Email repetido', "INSERT INTO usuario (id,nombre,apellido,email,password_hash) VALUES (UUID_TO_BIN(UUID()),'X','Y','tutor@trama.test',REPEAT('x',60))", TRUE);
CALL probar('Usuario sin email', "INSERT INTO usuario (id,nombre,apellido,password_hash) VALUES (UUID_TO_BIN(UUID()),'X','Y',REPEAT('x',60))", TRUE);

-- Membresías
CALL probar('Dos membresías del mismo usuario en el mismo niño', "INSERT INTO membresia (id,usuario_id,proyecto_id,rol) VALUES (UUID_TO_BIN(UUID()),@u_psico,@p_tomi,'FAMILIAR')", TRUE);
CALL probar('Membresía a un proyecto inexistente', "INSERT INTO membresia (id,usuario_id,proyecto_id,rol) VALUES (UUID_TO_BIN(UUID()),@u_familiar,@fantasma,'FAMILIAR')", TRUE);
CALL probar('Rol inválido', "INSERT INTO membresia (id,usuario_id,proyecto_id,rol) VALUES (UUID_TO_BIN(UUID()),@u_familiar,@p_juli,'ADMIN')", TRUE);
CALL probar('Admin que no es TUTOR', "INSERT INTO membresia (id,usuario_id,proyecto_id,rol,es_admin) VALUES (UUID_TO_BIN(UUID()),@u_familiar,@p_juli,'FAMILIAR',TRUE)", TRUE);
CALL probar('Especialidad en un FAMILIAR', "INSERT INTO membresia (id,usuario_id,proyecto_id,rol,especialidad) VALUES (UUID_TO_BIN(UUID()),@u_familiar,@p_juli,'FAMILIAR','DOCENTE')", TRUE);
CALL probar('Membresía válida (familiar en Juli)', "INSERT INTO membresia (id,usuario_id,proyecto_id,rol) VALUES (UUID_TO_BIN(UUID()),@u_familiar,@p_juli,'FAMILIAR')", FALSE);

-- Aportes
CALL probar('Visibilidad inválida', "INSERT INTO aporte (id,proyecto_id,autor_id,tipo,titulo,visibilidad) VALUES (UUID_TO_BIN(UUID()),@p_tomi,@u_tutor,'INTERES','X','PUBLICO')", TRUE);
CALL probar('Aporte con autor inexistente', "INSERT INTO aporte (id,proyecto_id,autor_id,tipo,titulo) VALUES (UUID_TO_BIN(UUID()),@p_tomi,@fantasma,'INTERES','X')", TRUE);
CALL probar('Confirmar dos veces el mismo aporte', "INSERT INTO confirmacion_aporte (aporte_id,usuario_id) VALUES (@a1,@u_psico),(@a1,@u_psico)", TRUE);

-- Archivos (5 MB, solo PDF/JPG/PNG)
CALL probar('Archivo de 6 MB', "INSERT INTO archivo (id,proyecto_id,autor_id,nombre_original,tipo_mime,tamano_bytes,ruta) VALUES (UUID_TO_BIN(UUID()),@p_tomi,@u_tutor,'a.pdf','application/pdf',6291456,UUID())", TRUE);
CALL probar('Archivo .exe', "INSERT INTO archivo (id,proyecto_id,autor_id,nombre_original,tipo_mime,tamano_bytes,ruta) VALUES (UUID_TO_BIN(UUID()),@p_tomi,@u_tutor,'a.exe','application/x-msdownload',1000,UUID())", TRUE);
CALL probar('Archivo PDF de 2 MB', "INSERT INTO archivo (id,proyecto_id,autor_id,nombre_original,tipo_mime,tamano_bytes,ruta) VALUES (UUID_TO_BIN(UUID()),@p_tomi,@u_tutor,'informe.pdf','application/pdf',2097152,UUID())", FALSE);

-- Calendario
CALL probar('Acta en un evento común', "INSERT INTO evento (id,proyecto_id,autor_id,tipo,titulo,fecha,acta) VALUES (UUID_TO_BIN(UUID()),@p_tomi,@u_tutor,'COMUN','X','2026-11-01',X'00')", TRUE);
CALL probar('Hora de fin antes que la de inicio', "INSERT INTO evento (id,proyecto_id,autor_id,titulo,fecha,hora_inicio,hora_fin) VALUES (UUID_TO_BIN(UUID()),@p_tomi,@u_tutor,'X','2026-11-01','10:00','09:00')", TRUE);
CALL probar('Evento recurrente sin día de la semana', "INSERT INTO evento (id,proyecto_id,autor_id,titulo,fecha,recurrente) VALUES (UUID_TO_BIN(UUID()),@p_tomi,@u_tutor,'X','2026-11-01',TRUE)", TRUE);

-- Registro de acciones
CALL probar('Acción de registro inválida', "INSERT INTO registro_accion (id,usuario_id,proyecto_id,accion,seccion) VALUES (UUID_TO_BIN(UUID()),@u_tutor,@p_tomi,'BORRAR','aportes')", TRUE);

-- Borrado de un niño (8.2): todo su contenido desaparece en cascada
CALL probar('Guardar una versión de un aporte de Tomi', "INSERT INTO aporte_version (id,aporte_id,autor_id,titulo) VALUES (UUID_TO_BIN(UUID()),@a1,@u_tutor,'v1')", FALSE);
SET @foto = UUID_TO_BIN(UUID());
INSERT INTO archivo (id,proyecto_id,autor_id,nombre_original,tipo_mime,tamano_bytes,ruta) VALUES (@foto,@p_tomi,@u_tutor,'tomi.jpg','image/jpeg',204800,UUID());
UPDATE proyecto SET foto_archivo_id = @foto WHERE id = @p_tomi;
INSERT INTO registro_accion (id,usuario_id,proyecto_id,accion,seccion) VALUES (UUID_TO_BIN(UUID()),@u_tutor,@p_tomi,'CREAR','aportes');
CALL probar('Borrar a Tomi (con foto, aportes, eventos, registro)', "DELETE FROM proyecto WHERE id = @p_tomi", FALSE);

INSERT INTO resultado (prueba, esperado, obtenido, ok)
SELECT 'Después del borrado no queda nada de Tomi', '0 filas', CAST(total AS CHAR), IF(total = 0,'OK','XX') FROM (
  SELECT (SELECT COUNT(*) FROM membresia WHERE proyecto_id=@p_tomi) + (SELECT COUNT(*) FROM aporte WHERE proyecto_id=@p_tomi)
       + (SELECT COUNT(*) FROM aporte_version WHERE aporte_id=@a1)   + (SELECT COUNT(*) FROM archivo WHERE proyecto_id=@p_tomi)
       + (SELECT COUNT(*) FROM evento WHERE proyecto_id=@p_tomi)     + (SELECT COUNT(*) FROM registro_accion WHERE proyecto_id=@p_tomi)
       + (SELECT COUNT(*) FROM invitacion WHERE proyecto_id=@p_tomi) AS total) t;

INSERT INTO resultado (prueba, esperado, obtenido, ok)
SELECT 'Los usuarios de Tomi siguen existiendo', '8 usuarios', CAST(COUNT(*) AS CHAR), IF(COUNT(*) = 8,'OK','XX') FROM usuario;

ROLLBACK;

SELECT n AS '#', prueba, esperado, obtenido, ok FROM resultado ORDER BY n;
SELECT CONCAT(SUM(ok='OK'), ' de ', COUNT(*), ' pruebas OK') AS resumen FROM resultado;
DROP PROCEDURE probar;
