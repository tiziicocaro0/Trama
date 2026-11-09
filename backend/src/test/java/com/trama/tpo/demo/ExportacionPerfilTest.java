package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import org.springframework.http.MediaType;
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

// 8.3: exportar el perfil o "Conocelo en 5 minutos" en PDF, solo con lo que cada persona puede ver
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ExportacionPerfilTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private AporteRepository aporteRepository;
    @Autowired private AporteVersionRepository aporteVersionRepository;

    private Usuario tutora;
    private Usuario familiar;
    private Usuario docente;
    private Usuario psicologa;
    private Usuario ajeno;
    private Proyecto proyecto;

    @BeforeEach
    void prepararDatos() {
        tutora = crearUsuario("Tutora");
        familiar = crearUsuario("Familiar");
        docente = crearUsuario("Docente");
        psicologa = crearUsuario("Psicologa");
        ajeno = crearUsuario("Ajeno");
        // Por defecto los familiares no ven las notas profesionales (1.8)
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

        crearAporte(tutora, TipoAporte.FORTALEZA, "Le gusta dibujar", Visibilidad.TODOS);
        crearAporte(familiar, TipoAporte.INTERES, "Dinosaurios", Visibilidad.TODOS);
        crearAporte(psicologa, TipoAporte.NOTA_PROFESIONAL, "Nota de salud", Visibilidad.SOLO_SALUD);
        crearAporte(docente, TipoAporte.NOTA_PROFESIONAL, "Nota de la escuela", Visibilidad.SOLO_EDUCACION);
    }

    @AfterEach
    void limpiarDatos() {
        // Al borrar el proyecto, la base borra sus registros (V5)
        aporteVersionRepository.eliminarPorProyectoId(proyecto.getId());
        for (boolean archivado : List.of(false, true)) {
            aporteRepository.deleteAll(aporteRepository
                    .findByProyectoIdAndArchivadoOrderByCreadoEnDesc(proyecto.getId(), archivado));
        }
        membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
        proyectoRepository.delete(proyecto);
        usuarioRepository.deleteAll(List.of(tutora, familiar, docente, psicologa, ajeno));
    }

    // CRITERIO 2 (test de la card): el PDF de un docente no incluye aportes SOLO_SALUD
    @Test
    void elPdfDeLaDocenteNoIncluyeLoDeSalud() throws Exception {
        String texto = textoDelPdf(docente, "perfil");

        assertThat(texto).contains("Le gusta dibujar", "Dinosaurios", "Nota de la escuela");
        assertThat(texto).doesNotContain("Nota de salud");
    }

    @Test
    void elPdfDeLaPsicologaIncluyeLoDeSaludYNoLoDeEducacion() throws Exception {
        String texto = textoDelPdf(psicologa, "perfil");

        assertThat(texto).contains("Nota de salud");
        assertThat(texto).doesNotContain("Nota de la escuela");
    }

    // 1.8: sin permiso para ver notas, la sección ni siquiera aparece
    @Test
    void unaFamiliarSinPermisoNoVeLaSeccionNotas() throws Exception {
        String texto = textoDelPdf(familiar, "perfil");

        assertThat(texto).contains("Le gusta dibujar", "Dinosaurios");
        assertThat(texto).doesNotContain("Notas", "Nota de salud", "Nota de la escuela");
    }

    // CRITERIO 1: también "Conocelo en 5 minutos"
    @Test
    void conoceloTraeSusSeisSecciones() throws Exception {
        String texto = textoDelPdf(tutora, "conocelo");

        assertThat(texto).contains("Conocelo en 5 minutos: Niño");
        assertThat(texto).contains("Intereses", "Fortalezas", "Comunicación", "Perfil sensorial",
                "Estrategias que funcionan", "Si se desregula");
        assertThat(texto).contains("Le gusta dibujar", "Dinosaurios");
    }

    // CRITERIO 2: el PDF tiene fecha (y hora) y se descarga sin el nombre del niño
    @Test
    void tieneFechaYSeDescargaComoArchivo() throws Exception {
        exportar(tutora, "perfil")
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PDF_VALUE))
                .andExpect(header().string("Content-Disposition", containsString("trama-perfil-")));

        assertThat(textoDelPdf(tutora, "perfil")).containsPattern("\\d{2}/\\d{2}/\\d{4} · \\d{2}:\\d{2}");
    }

    // Acceso denegado: primero el permiso, aunque la sección esté mal
    @Test
    void alguienAjenoRecibe403() throws Exception {
        exportar(ajeno, "perfil").andExpect(status().isForbidden());
        exportar(ajeno, "cualquiera").andExpect(status().isForbidden());
    }

    @Test
    void unaSeccionInvalidaRecibe400() throws Exception {
        exportar(tutora, "bitacora")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("SECCION_INVALIDA"));
        mockMvc.perform(get(ruta()).header("Authorization", token(tutora)))
                .andExpect(status().isBadRequest());
    }

    // Auditoría (0.2): la descarga queda en el registro de accesos (8.0)
    @Test
    void laDescargaQuedaRegistrada() throws Exception {
        exportar(docente, "perfil").andExpect(status().isOk());

        mockMvc.perform(get("/api/proyectos/" + proyecto.getId() + "/registro-accesos?usuarioId=" + docente.getId())
                        .header("Authorization", token(tutora)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].accion").value("VER"))
                .andExpect(jsonPath("$[0].seccion").value("PDF_PERFIL"));
    }

    // ---------- Datos de prueba ----------

    private String textoDelPdf(Usuario usuario, String seccion) throws Exception {
        byte[] pdf = exportar(usuario, seccion)
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

    private ResultActions exportar(Usuario usuario, String seccion) throws Exception {
        return mockMvc.perform(get(ruta() + "?seccion=" + seccion).header("Authorization", token(usuario)));
    }

    private void crearAporte(Usuario autor, TipoAporte tipo, String titulo, Visibilidad visibilidad) {
        aporteRepository.save(Aporte.builder()
                .proyecto(proyecto).autor(autor)
                .tipo(tipo).titulo(titulo).contenido("Texto de prueba")
                .visibilidad(visibilidad)
                .build());
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

    private String ruta() {
        return "/api/proyectos/" + proyecto.getId() + "/exportar-perfil";
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}
