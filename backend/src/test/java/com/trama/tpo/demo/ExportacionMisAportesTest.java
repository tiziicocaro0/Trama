package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
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

// 8.4: cada miembro descarga lo que cargó en un niño, y nada de lo que cargaron otros
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ExportacionMisAportesTest {

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
    private Usuario ajeno;
    private Proyecto proyecto;
    private Aporte activo;
    private Aporte archivado;
    private Aporte deLaDocente;

    @BeforeEach
    void prepararDatos() {
        tutora = crearUsuario("Tutora");
        familiar = crearUsuario("Familiar");
        docente = crearUsuario("Docente");
        ajeno = crearUsuario("Ajeno");
        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Niño").apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba").grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());
        crearMembresia(tutora, Rol.TUTOR, true);
        crearMembresia(familiar, Rol.FAMILIAR, false);
        crearMembresia(docente, Rol.EDUCACION, false);

        activo = crearAporte(familiar, TipoAporte.FORTALEZA, "Le gusta dibujar", false);
        archivado = crearAporte(familiar, TipoAporte.INTERES, "Dinosaurios", true);
        deLaDocente = crearAporte(docente, TipoAporte.ESTRATEGIA, "Agenda visual en el aula", false);
    }

    @AfterEach
    void limpiarDatos() {
        // Al borrar el proyecto, la base borra sus registros (V5)
        aporteVersionRepository.eliminarPorProyectoId(proyecto.getId());
        for (boolean estaArchivado : List.of(false, true)) {
            aporteRepository.deleteAll(aporteRepository
                    .findByProyectoIdAndArchivadoOrderByCreadoEnDesc(proyecto.getId(), estaArchivado));
        }
        membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
        proyectoRepository.delete(proyecto);
        usuarioRepository.deleteAll(List.of(tutora, familiar, docente, ajeno));
    }

    // CRITERIO 1: todo lo que yo cargué, también lo archivado
    @Test
    void elJsonTraeMisAportesTambienLosArchivados() throws Exception {
        exportar(familiar, "json")
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("trama-mis-aportes-")))
                .andExpect(jsonPath("$.autor").value("Familiar Prueba"))
                .andExpect(jsonPath("$.nino").value("Niño"))
                .andExpect(jsonPath("$.aportes.length()").value(2))
                .andExpect(jsonPath("$.aportes[*].id", hasItem(activo.getId().toString())))
                .andExpect(jsonPath("$.aportes[*].id", hasItem(archivado.getId().toString())));
    }

    // CRITERIO 2: no incluye lo que cargaron otros
    @Test
    void noIncluyeLoQueCargaronOtros() throws Exception {
        exportar(familiar, "json")
                .andExpect(jsonPath("$.aportes[*].id", not(hasItem(deLaDocente.getId().toString()))));

        assertThat(textoDelPdf(familiar)).doesNotContain("Agenda visual en el aula");
    }

    @Test
    void elPdfTraeLaLineaDeTiempoConLosArchivadosYLaHora() throws Exception {
        String texto = textoDelPdf(familiar);

        assertThat(texto).contains("Mis aportes · Niño", "Le gusta dibujar", "Dinosaurios", "ARCHIVADO");
        assertThat(texto).contains("2 aportes, del más reciente al más antiguo (1 archivado).");
        assertThat(texto).containsPattern("\\d{2}/\\d{2}/\\d{4} · \\d{2}:\\d{2}");
    }

    @Test
    void sinAportesElPdfLoDice() throws Exception {
        assertThat(textoDelPdf(tutora)).contains("Todavía no cargaste aportes en este acompañamiento.");
    }

    // Acceso denegado: primero el permiso, aunque el formato esté mal
    @Test
    void alguienAjenoRecibe403() throws Exception {
        exportar(ajeno, "json").andExpect(status().isForbidden());
        exportar(ajeno, "xml").andExpect(status().isForbidden());
    }

    @Test
    void unFormatoInvalidoRecibe400() throws Exception {
        exportar(familiar, "xml")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("FORMATO_INVALIDO"));
        mockMvc.perform(get(ruta()).header("Authorization", token(familiar)))
                .andExpect(status().isBadRequest());
    }

    // Auditoría (0.2): la descarga queda en el registro de accesos (8.0)
    @Test
    void laDescargaQuedaRegistrada() throws Exception {
        exportar(familiar, "json").andExpect(status().isOk());

        mockMvc.perform(get("/api/proyectos/" + proyecto.getId() + "/registro-accesos?usuarioId=" + familiar.getId())
                        .header("Authorization", token(tutora)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].accion").value("VER"))
                .andExpect(jsonPath("$[0].seccion").value("MIS_APORTES"));
    }

    // ---------- Datos de prueba ----------

    private String textoDelPdf(Usuario usuario) throws Exception {
        byte[] pdf = exportar(usuario, "pdf")
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

    private ResultActions exportar(Usuario usuario, String formato) throws Exception {
        return mockMvc.perform(get(ruta() + "?formato=" + formato).header("Authorization", token(usuario)));
    }

    private Aporte crearAporte(Usuario autor, TipoAporte tipo, String titulo, boolean estaArchivado) {
        return aporteRepository.save(Aporte.builder()
                .proyecto(proyecto).autor(autor)
                .tipo(tipo).titulo(titulo).contenido("Texto de prueba")
                .visibilidad(Visibilidad.TODOS).archivado(estaArchivado)
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
        return "/api/proyectos/" + proyecto.getId() + "/mis-aportes/exportar";
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}
