package com.trama.tpo.demo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.aporte.observacion.DatosObservacion;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ObservacionControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private AporteRepository aporteRepository;
    @Autowired private AporteVersionRepository aporteVersionRepository;

    private final ObjectMapper mapper = new ObjectMapper();

    private Usuario tutor;
    private Proyecto proyecto;

    @BeforeEach
    void prepararDatos() {
        tutor = usuarioRepository.save(Usuario.builder()
                .nombre("TutorObservacion")
                .apellido("Prueba")
                .email("observacion." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());

        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Niño")
                .apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba")
                .grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());

        membresiaRepository.save(Membresia.builder()
                .usuario(tutor)
                .proyecto(proyecto)
                .rol(Rol.TUTOR)
                .esAdmin(true)
                .build());
    }

    @AfterEach
    void limpiarDatos() {
        aporteVersionRepository.eliminarPorProyectoId(proyecto.getId());

        aporteRepository.deleteAll(
                aporteRepository.findByProyectoIdAndArchivadoOrderByCreadoEnDesc(
                        proyecto.getId(), false));

        aporteRepository.deleteAll(
                aporteRepository.findByProyectoIdAndArchivadoOrderByCreadoEnDesc(
                        proyecto.getId(), true));

        membresiaRepository.deleteAll(
                membresiaRepository.findByProyectoId(proyecto.getId()));

        proyectoRepository.delete(proyecto);
        usuarioRepository.delete(tutor);
    }

    // 1. CREAR OBSERVACIÓN VÁLIDA

    @Test
    void crearObservacionExitosamente() throws Exception {
        String request = requestObservacion(
                "Observación en la escuela",
                "Participó en una actividad grupal",
                "2026-10-23T12:30:00-03:00",
                "ESCUELA", List.of("LOGRO", "SOCIAL"));

        mockMvc.perform(post(rutaAportes())
                .header("Authorization", token())
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipo").value("OBSERVACION"))
                .andExpect(jsonPath("$.titulo")
                        .value("Observación en la escuela"))
                .andExpect(jsonPath("$.contenido")
                        .value("Participó en una actividad grupal"))
                .andExpect(jsonPath("$.autorId")
                        .value(tutor.getId().toString()))
                .andExpect(jsonPath("$.datos").isNotEmpty());
    }

    // 2. RECHAZAR OBSERVACIÓN SIN ETIQUETAS

    @Test
    void crearObservacionSinEtiquetasEsRechazada() throws Exception {
        comprobarSolicitudInvalida(requestObservacion(
                "Sin etiquetas", "Actividad registrada",
                "2026-10-23T12:30:00-03:00",
                "ESCUELA", List.of()));
    }

    // 3. RECHAZAR OBSERVACIÓN SIN CONTEXTO

    @Test
    void crearObservacionSinContextoEsRechazada() throws Exception {
        comprobarSolicitudInvalida(requestObservacion(
                "Sin contexto", "Actividad registrada",
                "2026-10-23T12:30:00-03:00",
                null, List.of("LOGRO")));
    }

    // 4. RECHAZAR OBSERVACIÓN SIN FECHA

    @Test
    void crearObservacionSinFechaEsRechazada() throws Exception {
        comprobarSolicitudInvalida(requestObservacion(
                "Sin fecha", "Actividad registrada",
                null, "ESCUELA", List.of("LOGRO")));
    }

    // 5. RECHAZAR OBSERVACIÓN SIN TEXTO

    @Test
    void crearObservacionSinTextoEsRechazada() throws Exception {
        comprobarSolicitudInvalida(requestObservacion(
                "Sin texto", "",
                "2026-10-23T12:30:00-03:00",
                "ESCUELA", List.of("LOGRO")));
    }

    // 6. ORDENAR OBSERVACIONES POR FECHA

    @Test
    void listarObservacionesOrdenadasPorFecha() throws Exception {
        crearObservacion("Observación reciente",
                "2026-10-22T10:00:00-03:00", "ESCUELA");

        crearObservacion("Observación antigua",
                "2026-10-18T10:00:00-03:00", "CASA");

        mockMvc.perform(get(rutaAportes())
                .param("tipo", "OBSERVACION")
                .header("Authorization", token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].titulo")
                        .value("Observación reciente"))
                .andExpect(jsonPath("$[1].titulo")
                        .value("Observación antigua"));
    }

    // 7. RECHAZAR ETIQUETA INVÁLIDA

    @Test
    void crearObservacionConEtiquetaInvalidaEsRechazada()
            throws Exception {
        comprobarSolicitudInvalida(requestObservacion(
                "Etiqueta inválida", "Actividad registrada",
                "2026-10-23T12:30:00-03:00",
                "ESCUELA", List.of("DEPORTE")));
    }

    // 8. RECHAZAR CONTEXTO INVÁLIDO

    @Test
    void crearObservacionConContextoInvalidoEsRechazada()
            throws Exception {
        comprobarSolicitudInvalida(requestObservacion(
                "Contexto inválido", "Actividad registrada",
                "2026-10-23T12:30:00-03:00",
                "PARQUE", List.of("LOGRO")));
    }

    // 9. EDITAR OBSERVACIÓN

    @Test
    void editarObservacionExitosamente() throws Exception {
        String crear = requestObservacion(
                "Observación inicial", "Participó en clase",
                "2026-10-20T10:00:00-03:00",
                "ESCUELA", List.of("LOGRO"));

        String respuesta = mockMvc.perform(post(rutaAportes())
                .header("Authorization", token())
                .contentType(MediaType.APPLICATION_JSON)
                .content(crear))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String id = mapper.readTree(respuesta).get("id").asText();

        String editar = requestObservacion(
                "Observación actualizada",
                "Participó y colaboró con sus compañeros",
                "2026-10-22T14:00:00-03:00",
                "CASA", List.of("SOCIAL", "COMUNICACION"));

        mockMvc.perform(put(rutaAportes() + "/" + id)
                .header("Authorization", token())
                .contentType(MediaType.APPLICATION_JSON)
                .content(editar))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo")
                        .value("Observación actualizada"))
                .andExpect(jsonPath("$.contenido")
                        .value("Participó y colaboró con sus compañeros"))
                .andExpect(jsonPath("$.datos").isNotEmpty());

        mockMvc.perform(get(rutaAportes())
                .param("tipo", "OBSERVACION")
                .header("Authorization", token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].titulo")
                        .value("Observación actualizada"))
                .andExpect(jsonPath("$[0].contenido")
                        .value("Participó y colaboró con sus compañeros"))
                .andExpect(jsonPath("$[0].datos")
                        .value(org.hamcrest.Matchers.containsString(
                                "\"contexto\":\"CASA\"")))
                .andExpect(jsonPath("$[0].datos")
                        .value(org.hamcrest.Matchers.containsString(
                                "COMUNICACION")));
    }

    // MÉTODOS AUXILIARES

    private String requestObservacion(
            String titulo, String contenido, String fecha,
            String contexto, List<String> etiquetas) throws Exception {

        Map<String, Object> datos = new java.util.LinkedHashMap<>();
        if (fecha != null) datos.put("fecha", fecha);
        if (contexto != null) datos.put("contexto", contexto);
        datos.put("etiquetas", etiquetas);

        return mapper.writeValueAsString(Map.of(
                "tipo", "OBSERVACION",
                "titulo", titulo,
                "contenido", contenido,
                "datos", mapper.writeValueAsString(datos),
                "visibilidad", "TODOS"));
    }

    private void comprobarSolicitudInvalida(String request)
            throws Exception {
        mockMvc.perform(post(rutaAportes())
                .header("Authorization", token())
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isBadRequest());
    }

    private void crearObservacion(
            String titulo, String fecha, String contexto) throws Exception {
        mockMvc.perform(post(rutaAportes())
                .header("Authorization", token())
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestObservacion(
                        titulo, "Actividad registrada",
                        fecha, contexto, List.of("LOGRO"))))
                .andExpect(status().isCreated());
    }

    private String rutaAportes() {
        return "/api/proyectos/" + proyecto.getId() + "/aportes";
    }

    private String token() {
        return "Bearer " + jwtService.generateToken(tutor.getId());
    }
}