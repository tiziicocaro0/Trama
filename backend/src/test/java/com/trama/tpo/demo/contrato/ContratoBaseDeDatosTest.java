package com.trama.tpo.demo.contrato;

import static com.trama.tpo.demo.contrato.FuenteFrontend.nombres;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.entity.dto.AporteRequest;
import com.trama.tpo.demo.entity.dto.CrearProyectoRequest;
import com.trama.tpo.demo.entity.dto.EspecialidadItemRequest;
import com.trama.tpo.demo.entity.dto.InvitacionRequest;
import com.trama.tpo.demo.entity.dto.RegisterRequest;
import com.trama.tpo.demo.entity.invitacion.EstadoInvitacion;
import com.trama.tpo.demo.entity.membresia.Especialidad;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.registro.AccionRegistro;
import com.trama.tpo.demo.service.ArchivoService;

import jakarta.validation.constraints.Size;

/**
 * Contratos entre el código Java y el esquema que crean las migraciones.
 * Hibernate (ddl-auto=validate) no revisa los CHECK ni los largos de las
 * columnas: si un enum suma un valor sin migración, o un DTO deja pasar más
 * texto del que entra en la columna, el error aparece recién al guardar (500).
 */
@SpringBootTest
@ActiveProfiles("test")
class ContratoBaseDeDatosTest {

    private static final Pattern VALOR_ENTRE_COMILLAS = Pattern.compile("'([^']+)'");

    @Autowired private JdbcTemplate jdbc;

    // ---------------------------------------------------------------
    // 1. Todo valor que Java puede guardar lo acepta el CHECK de la base
    // ---------------------------------------------------------------

    @Test
    void rolesDeMembresiaEInvitacion() {
        assertEquals(nombres(Rol.class), valoresDelCheck("ck_membresia_rol"));
        assertEquals(nombres(Rol.class), valoresDelCheck("ck_invitacion_rol"));
    }

    @Test
    void visibilidadDeAportes() {
        assertEquals(nombres(Visibilidad.class), valoresDelCheck("ck_aporte_visibilidad"));
    }

    @Test
    void especialidades() {
        assertEquals(nombres(Especialidad.class), valoresDelCheck("ck_mesp_especialidad"));
    }

    @Test
    void estadosDeInvitacion() {
        // La base admite además CANCELADA (pensado para cancelar invitaciones): alcanza con que
        // todo estado que usa Java esté permitido.
        Set<String> base = valoresDelCheck("ck_invitacion_estado");
        assertTrue(base.containsAll(nombres(EstadoInvitacion.class)),
                "EstadoInvitacion tiene valores que la base rechaza: " + nombres(EstadoInvitacion.class));
    }

    @Test
    void accionesDelRegistro() {
        assertEquals(nombres(AccionRegistro.class), valoresDelCheck("ck_registro_accion"));
    }

    @Test
    void tiposDeArchivo() {
        assertEquals(ArchivoService.MIMES_PERMITIDOS, valoresDelCheck("ck_archivo_mime"));
    }

    // ---------------------------------------------------------------
    // 2. El @Size de cada DTO coincide con el largo de su columna
    // ---------------------------------------------------------------

    @Test
    void largosDeUsuario() throws Exception {
        for (String campo : List.of("nombre", "apellido", "email")) {
            assertEquals(largoColumna("usuario", campo), maximo(RegisterRequest.class, campo),
                    "usuario." + campo);
        }
    }

    @Test
    void largosDeProyecto() throws Exception {
        for (String campo : List.of("nombre", "apellido", "apodo", "escuela", "grado")) {
            assertEquals(largoColumna("proyecto", campo), maximo(CrearProyectoRequest.class, campo),
                    "proyecto." + campo);
        }
    }

    @Test
    void largosDeAporteInvitacionYEspecialidad() throws Exception {
        assertEquals(largoColumna("aporte", "titulo"), maximo(AporteRequest.class, "titulo"));
        assertEquals(largoColumna("aporte_version", "titulo"), maximo(AporteRequest.class, "titulo"));
        assertEquals(largoColumna("invitacion", "email"), maximo(InvitacionRequest.class, "email"));
        assertEquals(largoColumna("membresia_especialidad", "aclaracion"),
                maximo(EspecialidadItemRequest.class, "aclaracion"));
    }

    // ---------------------------------------------------------------

    private Set<String> valoresDelCheck(String nombreCheck) {
        List<String> clausulas = jdbc.queryForList("""
                SELECT CHECK_CLAUSE
                FROM information_schema.CHECK_CONSTRAINTS
                WHERE CONSTRAINT_SCHEMA = DATABASE()
                  AND CONSTRAINT_NAME = ?
                """, String.class, nombreCheck);
        assertEquals(1, clausulas.size(), "No existe el CHECK " + nombreCheck + " en la base");

        Set<String> valores = new LinkedHashSet<>();
        // MySQL devuelve la cláusula con las comillas escapadas (_utf8mb4\'TUTOR\')
        Matcher m = VALOR_ENTRE_COMILLAS.matcher(clausulas.get(0).replace("\\'", "'"));
        while (m.find()) {
            valores.add(m.group(1));
        }
        return valores;
    }

    private int largoColumna(String tabla, String columna) {
        Integer largo = jdbc.queryForObject("""
                SELECT CHARACTER_MAXIMUM_LENGTH
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND COLUMN_NAME = ?
                """, Integer.class, tabla, columna);
        assertTrue(largo != null, "No existe la columna " + tabla + "." + columna);
        return largo;
    }

    private static int maximo(Class<?> dto, String campo) throws NoSuchFieldException {
        Size size = dto.getDeclaredField(campo).getAnnotation(Size.class);
        assertTrue(size != null, dto.getSimpleName() + "." + campo + " no tiene @Size");
        return size.max();
    }
}
