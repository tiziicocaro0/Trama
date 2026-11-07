package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.parser.PdfTextExtractor;
import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.*;

// 8.1: el PDF muestra los aportes en línea de tiempo y se puede filtrar por fechas, tipos y personas
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ExportacionFiltrosTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private AporteRepository aporteRepository;
    @Autowired private AporteVersionRepository aporteVersionRepository;

    private Usuario tutora;
    private Usuario familiar;
    private Usuario docente;
    private Usuario psicologa;
    private Proyecto proyecto;

    @BeforeEach
    void prepararDatos() {
        tutora = crearUsuario("Tutora");
        familiar = crearUsuario("Familiar");
        docente = crearUsuario("Docente");
        psicologa = crearUsuario("Psicologa");
        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Niño").apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba").grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());
        crearMembresia(tutora, Rol.TUTOR, true);
        crearMembresia(familiar, Rol.FAMILIAR, false);
        crearMembresia(docente, Rol.EDUCACION, false);
        crearMembresia(psicologa, Rol.SALUD, false);

        crearAporte(familiar, "Aporte de la familia", LocalDate.of(2026, 9, 10));
        crearAporte(docente, "Aporte de la docente", LocalDate.of(2026, 10, 15));
        crearAporte(psicologa, "Aporte de la psicologa", LocalDate.of(2026, 11, 1));
    }

    @AfterEach
    void limpiarDatos() {
        aporteVersionRepository.eliminarPorProyectoId(proyecto.getId());
        for (boolean archivado : List.of(false, true)) {
            aporteRepository.deleteAll(aporteRepository
                    .findByProyectoIdAndArchivadoOrderByCreadoEnDesc(proyecto.getId(), archivado));
        }
        membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
        proyectoRepository.delete(proyecto);
        usuarioRepository.deleteAll(List.of(tutora, familiar, docente, psicologa));
    }

    // "Exportar todo": sin filtros entran los tres, agrupados por mes
    @Test
    void sinFiltrosEntranTodosEnLaLineaDeTiempo() throws Exception {
        String texto = textoDelPdf("");

        assertThat(texto).contains("Aporte de la familia", "Aporte de la docente", "Aporte de la psicologa");
        assertThat(texto).contains("Todos los aportes (3)");
        assertThat(texto).contains("NOVIEMBRE 2026", "OCTUBRE 2026", "SEPTIEMBRE 2026");
    }

    // El encabezado tiene la fecha y la hora
    @Test
    void elEncabezadoTieneFechaYHora() throws Exception {
        assertThat(textoDelPdf("")).containsPattern("\\d{2}/\\d{2}/\\d{4} · \\d{2}:\\d{2}");
    }

    @Test
    void filtraPorFechas() throws Exception {
        String texto = textoDelPdf("&desde=2026-10-01&hasta=2026-10-31");

        assertThat(texto).contains("Aporte de la docente").contains("Aportes filtrados (1)");
        assertThat(texto).doesNotContain("Aporte de la familia").doesNotContain("Aporte de la psicologa");
    }

    @Test
    void filtraPorTipoDeAportador() throws Exception {
        String texto = textoDelPdf("&tipos=DOCENTE,PROFESIONAL");

        assertThat(texto).contains("Aporte de la docente", "Aporte de la psicologa");
        assertThat(texto).doesNotContain("Aporte de la familia");
    }

    @Test
    void filtraPorPersona() throws Exception {
        String texto = textoDelPdf("&usuarios=" + familiar.getId());

        assertThat(texto).contains("Aporte de la familia").contains("1 persona elegida");
        assertThat(texto).doesNotContain("Aporte de la docente");
    }

    @Test
    void unRangoInvertidoRecibe400() throws Exception {
        exportar(tutora, "pdf&desde=2026-11-01&hasta=2026-10-01")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("RANGO_INVALIDO"));
    }

    @Test
    void unTipoDesconocidoRecibe400() throws Exception {
        exportar(tutora, "pdf&tipos=VECINOS")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("TIPO_INVALIDO"));
    }

    // Acceso denegado: primero el permiso, aunque los filtros estén mal
    @Test
    void unNoTutorRecibe403AunqueLosFiltrosEstenMal() throws Exception {
        exportar(familiar, "pdf&tipos=VECINOS").andExpect(status().isForbidden());
    }

    // El JSON es el del derecho de acceso: siempre trae todo
    @Test
    void elJsonIgnoraLosFiltros() throws Exception {
        exportar(tutora, "json&tipos=DOCENTE&desde=2026-10-01&hasta=2026-10-31")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.aportes.length()").value(3));
    }

    // ---------- Datos de prueba ----------

    private String textoDelPdf(String filtros) throws Exception {
        byte[] pdf = exportar(tutora, "pdf" + filtros)
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();
        PdfReader lector = new PdfReader(pdf);
        PdfTextExtractor extractor = new PdfTextExtractor(lector);
        StringBuilder texto = new StringBuilder();
        for (int pagina = 1; pagina <= lector.getNumberOfPages(); pagina++) {
            texto.append(extractor.getTextFromPage(pagina)).append('\n');
        }
        lector.close();
        return texto.toString();
    }

    private ResultActions exportar(Usuario usuario, String consulta) throws Exception {
        return mockMvc.perform(get("/api/proyectos/" + proyecto.getId() + "/exportar?formato=" + consulta)
                .header("Authorization", token(usuario)));
    }

    // La fecha de creación la pone la base: se corrige después para tener aportes de distintos meses
    private void crearAporte(Usuario autor, String titulo, LocalDate dia) {
        Aporte aporte = aporteRepository.save(Aporte.builder()
                .proyecto(proyecto).autor(autor)
                .tipo(TipoAporte.FORTALEZA).titulo(titulo).contenido("Texto de prueba")
                .visibilidad(Visibilidad.TODOS)
                .build());
        jdbcTemplate.update("UPDATE aporte SET creado_en = ? WHERE id = UUID_TO_BIN(?)",
                Timestamp.valueOf(dia.atTime(15, 0)), aporte.getId().toString());
    }

    private Usuario crearUsuario(String nombre) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre).apellido("Prueba")
                .email(nombre.toLowerCase() + "." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }

    private void crearMembresia(Usuario usuario, Rol rol, boolean esAdmin) {
        membresiaRepository.save(Membresia.builder()
                .usuario(usuario).proyecto(proyecto).rol(rol).esAdmin(esAdmin)
                .build());
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}
