package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
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

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.evento.Acuerdo;
import com.trama.tpo.demo.entity.evento.Evento;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.*;

// 8.1: descargar todos los datos del niño en JSON o PDF (solo tutores)
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ExportacionDatosTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private AporteRepository aporteRepository;
    @Autowired private AporteVersionRepository aporteVersionRepository;
    @Autowired private EventoRepository eventoRepository;
    @Autowired private AcuerdoRepository acuerdoRepository;

    private Usuario tutora;
    private Usuario cotutor;
    private Usuario familiar;
    private Usuario psicologa;
    private Usuario ajeno;
    private Proyecto proyecto;
    private Aporte nota;
    private Aporte archivado;

    @BeforeEach
    void prepararDatos() {
        tutora = crearUsuario("Tutora");
        cotutor = crearUsuario("Cotutor");
        familiar = crearUsuario("Familiar");
        psicologa = crearUsuario("Psicologa");
        ajeno = crearUsuario("Ajeno");
        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Niño").apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba").grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());
        crearMembresia(tutora, Rol.TUTOR, true);
        crearMembresia(cotutor, Rol.TUTOR, false);
        crearMembresia(familiar, Rol.FAMILIAR, false);
        crearMembresia(psicologa, Rol.SALUD, false);

        crearAporte(tutora, TipoAporte.FORTALEZA, "Le gusta dibujar", Visibilidad.TODOS, false);
        nota = crearAporte(psicologa, TipoAporte.NOTA_PROFESIONAL, "Nota de sesión", Visibilidad.SOLO_SALUD, false);
        archivado = crearAporte(tutora, TipoAporte.INTERES, "Dinosaurios", Visibilidad.TODOS, true);

        Evento reunion = eventoRepository.save(Evento.builder()
                .proyecto(proyecto).autor(tutora)
                .titulo("Reunión de equipo")
                .fecha(LocalDate.now().plusDays(2))
                .horaInicio(LocalTime.of(10, 0)).horaFin(LocalTime.of(11, 0))
                .tipo("REUNION")
                .acta("Acordamos rutinas visuales")
                .build());
        acuerdoRepository.save(Acuerdo.builder()
                .reunion(reunion).responsable(familiar)
                .descripcion("Practicar lectura")
                .fechaRevision(LocalDate.now().plusDays(10))
                .build());
    }

    @AfterEach
    void limpiarDatos() {
        // Al borrar el proyecto, la base borra sus eventos, acuerdos y registros (V4, V5)
        aporteVersionRepository.eliminarPorProyectoId(proyecto.getId());
        for (boolean estaArchivado : List.of(false, true)) {
            aporteRepository.deleteAll(aporteRepository
                    .findByProyectoIdAndArchivadoOrderByCreadoEnDesc(proyecto.getId(), estaArchivado));
        }
        membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
        proyectoRepository.delete(proyecto);
        usuarioRepository.deleteAll(List.of(tutora, cotutor, familiar, psicologa, ajeno));
    }

    // CRITERIOS 1 y 2: el tutor descarga en JSON perfil, miembros, aportes, eventos y notas
    @Test
    void laTutoraDescargaTodoEnJson() throws Exception {
        exportar(tutora, "json")
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("attachment")))
                .andExpect(header().string("Content-Disposition", containsString(".json")))
                .andExpect(jsonPath("$.proyecto.nombre").value("Niño"))
                .andExpect(jsonPath("$.miembros.length()").value(4))
                .andExpect(jsonPath("$.eventos.length()").value(1))
                .andExpect(jsonPath("$.acuerdos[0].descripcion").value("Practicar lectura"))
                .andExpect(jsonPath("$.exportadoEn").exists());
    }

    @Test
    void incluyeLasNotasYLosAportesArchivados() throws Exception {
        exportar(tutora, "json")
                .andExpect(jsonPath("$.aportes.length()").value(3))
                .andExpect(jsonPath("$.aportes[*].id", hasItem(nota.getId().toString())))
                .andExpect(jsonPath("$.aportes[*].id", hasItem(archivado.getId().toString())));
    }

    @Test
    void elActaSaleDescifrada() throws Exception {
        exportar(tutora, "json")
                .andExpect(jsonPath("$.eventos[0].acta").value("Acordamos rutinas visuales"));
    }

    // AGENTS.md: no se exponen los datos de otros usuarios
    @Test
    void noIncluyeLosEmailsDeLosMiembros() throws Exception {
        String json = exportar(tutora, "json").andReturn().getResponse().getContentAsString();

        assertThat(json).doesNotContain("@example.com");
    }

    // CRITERIO 1: también en PDF
    @Test
    void laTutoraDescargaElPdf() throws Exception {
        byte[] pdf = exportar(tutora, "pdf")
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PDF_VALUE))
                .andExpect(header().string("Content-Disposition", containsString(".pdf")))
                .andReturn().getResponse().getContentAsByteArray();

        assertThat(new String(pdf, 0, 5, StandardCharsets.US_ASCII)).isEqualTo("%PDF-");
    }

    @Test
    void unCotutorTambienPuede() throws Exception {
        exportar(cotutor, "json").andExpect(status().isOk());
    }

    // CRITERIO 3 (test de la card): los demás roles no pueden
    @Test
    void unNoTutorRecibe403() throws Exception {
        exportar(familiar, "json").andExpect(status().isForbidden());
        exportar(psicologa, "pdf").andExpect(status().isForbidden());
    }

    @Test
    void alguienAjenoRecibe403() throws Exception {
        exportar(ajeno, "json").andExpect(status().isForbidden());
    }

    @Test
    void unFormatoInvalidoRecibe400() throws Exception {
        exportar(tutora, "xml")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("FORMATO_INVALIDO"));
        mockMvc.perform(get(rutaExportar()).header("Authorization", token(tutora)))
                .andExpect(status().isBadRequest());
    }

    // Auditoría (0.2): la descarga aparece en el registro de accesos (8.0)
    @Test
    void laDescargaQuedaRegistrada() throws Exception {
        exportar(tutora, "json").andExpect(status().isOk());

        mockMvc.perform(get("/api/proyectos/" + proyecto.getId() + "/registro-accesos?usuarioId=" + tutora.getId())
                        .header("Authorization", token(tutora)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].accion").value("VER"))
                .andExpect(jsonPath("$[0].seccion").value("EXPORTACION"));
    }

    // ---------- Datos de prueba ----------

    private ResultActions exportar(Usuario usuario, String formato) throws Exception {
        return mockMvc.perform(get(rutaExportar() + "?formato=" + formato)
                .header("Authorization", token(usuario)));
    }

    private Aporte crearAporte(Usuario autor, TipoAporte tipo, String titulo, Visibilidad visibilidad,
            boolean estaArchivado) {
        return aporteRepository.save(Aporte.builder()
                .proyecto(proyecto).autor(autor)
                .tipo(tipo).titulo(titulo).contenido("Texto de prueba")
                .visibilidad(visibilidad).archivado(estaArchivado)
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

    private String rutaExportar() {
        return "/api/proyectos/" + proyecto.getId() + "/exportar";
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}
