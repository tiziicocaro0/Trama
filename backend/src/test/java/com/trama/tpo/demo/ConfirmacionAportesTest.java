package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
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

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.*;

// 3.3: confirmar un aporte ajeno ("Yo también lo observé" / "A mí también me funcionó")
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ConfirmacionAportesTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private AporteRepository aporteRepository;
    @Autowired private AporteVersionRepository aporteVersionRepository;

    private Usuario tutora;
    private Usuario familiar;
    private Usuario docente;
    private Proyecto proyecto;

    @BeforeEach
    void prepararDatos() {
        tutora = crearUsuario("Tutora");
        familiar = crearUsuario("Familiar");
        docente = crearUsuario("Docente");
        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Niño").apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba").grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());
        crearMembresia(tutora, Rol.TUTOR, true);
        crearMembresia(familiar, Rol.FAMILIAR, false);
        crearMembresia(docente, Rol.EDUCACION, false);
    }

    @AfterEach
    void limpiarDatos() {
        // Al borrar el aporte, la base borra sus confirmaciones; al borrar el proyecto, sus registros (V2, V5)
        aporteVersionRepository.eliminarPorProyectoId(proyecto.getId());
        for (boolean archivado : List.of(false, true)) {
            aporteRepository.deleteAll(aporteRepository
                    .findByProyectoIdAndArchivadoOrderByCreadoEnDesc(proyecto.getId(), archivado));
        }
        membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
        proyectoRepository.delete(proyecto);
        usuarioRepository.deleteAll(List.of(tutora, familiar, docente));
    }

    // CRITERIOS 1 y 2: puedo confirmar un aporte de otro y veo cuántos y quiénes
    @Test
    void unaFamiliarConfirmaElAporteDeLaTutora() throws Exception {
        UUID aporteId = crearAporte(tutora, "TODOS");

        confirmar(familiar, aporteId).andExpect(status().isNoContent());

        mockMvc.perform(get(rutaAportes()).header("Authorization", token(familiar)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].confirmaciones").value(1))
                .andExpect(jsonPath("$[0].yoConfirme").value(true))
                .andExpect(jsonPath("$[0].confirmadoPor[0]").value("Familiar Prueba"));

        // La autora ve la confirmación, pero no es suya
        mockMvc.perform(get(rutaAportes()).header("Authorization", token(tutora)))
                .andExpect(jsonPath("$[0].confirmaciones").value(1))
                .andExpect(jsonPath("$[0].yoConfirme").value(false));
    }

    @Test
    void dosPersonasConfirmanYAparecenLasDos() throws Exception {
        UUID aporteId = crearAporte(tutora, "TODOS");

        confirmar(familiar, aporteId).andExpect(status().isNoContent());
        confirmar(docente, aporteId).andExpect(status().isNoContent());

        mockMvc.perform(get(rutaAportes()).header("Authorization", token(tutora)))
                .andExpect(jsonPath("$[0].confirmaciones").value(2))
                .andExpect(jsonPath("$[0].confirmadoPor", containsInAnyOrder("Familiar Prueba", "Docente Prueba")));
    }

    // CRITERIO 3: puedo quitar mi confirmación
    @Test
    void quitarLaConfirmacionVuelveACero() throws Exception {
        UUID aporteId = crearAporte(tutora, "TODOS");
        confirmar(familiar, aporteId).andExpect(status().isNoContent());

        quitar(familiar, aporteId).andExpect(status().isNoContent());

        mockMvc.perform(get(rutaAportes()).header("Authorization", token(familiar)))
                .andExpect(jsonPath("$[0].confirmaciones").value(0))
                .andExpect(jsonPath("$[0].yoConfirme").value(false))
                .andExpect(jsonPath("$[0].confirmadoPor.length()").value(0));
    }

    // CRITERIO 4: el aporte original no cambia
    @Test
    void confirmarNoModificaElAporte() throws Exception {
        UUID aporteId = crearAporte(tutora, "TODOS");
        Aporte antes = aporteRepository.findById(aporteId).orElseThrow();

        confirmar(familiar, aporteId).andExpect(status().isNoContent());
        quitar(familiar, aporteId).andExpect(status().isNoContent());

        Aporte despues = aporteRepository.findById(aporteId).orElseThrow();
        assertThat(despues.getTitulo()).isEqualTo(antes.getTitulo());
        assertThat(despues.getContenido()).isEqualTo(antes.getContenido());
        assertThat(despues.getActualizadoEn()).isEqualTo(antes.getActualizadoEn());
        assertThat(aporteVersionRepository.findByAporteIdOrderByCreadoEnAsc(aporteId)).isEmpty();
    }

    // CRITERIO 5: no se puede confirmar un aporte propio
    @Test
    void confirmarElPropioAporteRecibe400() throws Exception {
        UUID aporteId = crearAporte(tutora, "TODOS");

        confirmar(tutora, aporteId)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("APORTE_PROPIO"));
    }

    @Test
    void confirmarDosVecesCuentaUnaSola() throws Exception {
        UUID aporteId = crearAporte(tutora, "TODOS");

        confirmar(familiar, aporteId).andExpect(status().isNoContent());
        confirmar(familiar, aporteId).andExpect(status().isNoContent());

        mockMvc.perform(get(rutaAportes()).header("Authorization", token(tutora)))
                .andExpect(jsonPath("$[0].confirmaciones").value(1));

        // Y deja un solo registro de auditoría
        mockMvc.perform(get(rutaRegistro() + "?usuarioId=" + familiar.getId())
                .header("Authorization", token(tutora)))
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void unAporteArchivadoNoSePuedeConfirmar() throws Exception {
        UUID aporteId = crearAporte(tutora, "TODOS");
        mockMvc.perform(post(rutaAportes() + "/" + aporteId + "/archivar").header("Authorization", token(tutora)))
                .andExpect(status().isNoContent());

        confirmar(familiar, aporteId)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("APORTE_ARCHIVADO"));
    }

    // Acceso denegado: quien no puede ver el aporte tampoco lo puede confirmar
    @Test
    void quienNoPuedeVerElAporteRecibe403() throws Exception {
        UUID aporteId = crearAporte(tutora, "SOLO_SALUD");

        confirmar(familiar, aporteId).andExpect(status().isForbidden());
        quitar(familiar, aporteId).andExpect(status().isForbidden());
    }

    @Test
    void alguienAjenoAlProyectoRecibe403() throws Exception {
        UUID aporteId = crearAporte(tutora, "TODOS");
        Usuario ajeno = crearUsuario("Ajeno");
        try {
            confirmar(ajeno, aporteId).andExpect(status().isForbidden());
        } finally {
            usuarioRepository.delete(ajeno);
        }
    }

    // Auditoría (0.2): confirmar y quitar quedan en el registro de accesos con el tipo de aporte
    @Test
    void confirmarYQuitarQuedanEnElRegistro() throws Exception {
        UUID aporteId = crearAporte(tutora, "TODOS");

        confirmar(familiar, aporteId).andExpect(status().isNoContent());
        quitar(familiar, aporteId).andExpect(status().isNoContent());

        String json = mockMvc.perform(get(rutaRegistro() + "?usuarioId=" + familiar.getId())
                        .header("Authorization", token(tutora)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode registros = objectMapper.readTree(json);
        assertThat(registros).hasSize(2);
        assertThat(registros.findValuesAsText("accion"))
                .containsExactlyInAnyOrder("CONFIRMAR", "QUITAR_CONFIRMACION");
        assertThat(registros.findValuesAsText("seccion")).containsOnly("FORTALEZA");
    }

    // ---------- Datos de prueba ----------

    private UUID crearAporte(Usuario autor, String visibilidad) throws Exception {
        String json = mockMvc.perform(post(rutaAportes())
                        .header("Authorization", token(autor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"tipo":"FORTALEZA","titulo":"Le gusta dibujar","contenido":"Texto de prueba",
                                 "datos":"{\\"contexto\\":\\"ESCUELA\\"}","visibilidad":"%s"}""".formatted(visibilidad)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(json).get("id").asText());
    }

    private ResultActions confirmar(Usuario usuario, UUID aporteId)
            throws Exception {
        return mockMvc.perform(post(rutaConfirmaciones(aporteId)).header("Authorization", token(usuario)));
    }

    private ResultActions quitar(Usuario usuario, UUID aporteId)
            throws Exception {
        return mockMvc.perform(delete(rutaConfirmaciones(aporteId)).header("Authorization", token(usuario)));
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

    private String rutaAportes() {
        return "/api/proyectos/" + proyecto.getId() + "/aportes";
    }

    private String rutaConfirmaciones(UUID aporteId) {
        return rutaAportes() + "/" + aporteId + "/confirmaciones";
    }

    private String rutaRegistro() {
        return "/api/proyectos/" + proyecto.getId() + "/registro-accesos";
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}
