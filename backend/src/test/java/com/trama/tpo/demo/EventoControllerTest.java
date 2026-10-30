package com.trama.tpo.demo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.EventoRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EventoControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private EventoRepository eventoRepository;

    private final ObjectMapper mapper = new ObjectMapper();

    private Usuario tutor;
    private Usuario docente;
    private Usuario familiar;
    private Usuario usuarioAjeno;
    private Proyecto proyecto;

    @BeforeEach
    void prepararDatos() {

        tutor = crearUsuario("TutorEvento");
        docente = crearUsuario("DocenteEvento");
        familiar = crearUsuario("FamiliarEvento");
        usuarioAjeno = crearUsuario("AjenoEvento");

        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Mateo")
                .apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba")
                .grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());

        crearMembresia(tutor, Rol.TUTOR, true);
        crearMembresia(docente, Rol.EDUCACION, false);
        crearMembresia(familiar, Rol.FAMILIAR, false);
    }

    @AfterEach
    void limpiarDatos() {

        if (proyecto != null) {
            eventoRepository.deleteAll(
                    eventoRepository.findByProyectoIdAndFechaBetweenOrderByFechaAscHoraInicioAsc(
                            proyecto.getId(),
                            LocalDate.of(1900, 1, 1),
                            LocalDate.of(9999, 12, 31)));

            membresiaRepository.deleteAll(
                    membresiaRepository.findByProyectoId(proyecto.getId()));

            proyectoRepository.delete(proyecto);
        }

        usuarioRepository.deleteAll(List.of(
                tutor, docente, familiar, usuarioAjeno));
    }

    // TEST 1: CREACIÓN EXITOSA

    @Test
    void crearEventoSiendoMiembroDevuelve201() throws Exception {

        mockMvc.perform(post(rutaEventos())
                .header("Authorization", token(docente))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestValido()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.titulo").value("Visita al museo"))
                .andExpect(jsonPath("$.autorId")
                        .value(docente.getId().toString()))
                .andExpect(jsonPath("$.fecha").value("2026-11-05"))
                .andExpect(jsonPath("$.id").exists());
    }

    // TEST 2: USUARIO AJENO NO PUEDE CREAR

    @Test
    void crearEventoSinSerMiembroDevuelve403() throws Exception {

        mockMvc.perform(post(rutaEventos())
                .header("Authorization", token(usuarioAjeno))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestValido()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo")
                        .value("ACCESO_DENEGADO"));
    }

    // TEST 3: DOCENTE NO PUEDE ELIMINAR EVENTO AJENO

    @Test
    void docenteNoPuedeEliminarEventoAjeno() throws Exception {

        String eventoId = crearEvento(familiar);

        mockMvc.perform(delete(rutaEventos() + "/" + eventoId)
                .header("Authorization", token(docente)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo")
                        .value("ACCESO_DENEGADO"));

        assertFalse(eventoRepository.findById(
                UUID.fromString(eventoId)).isEmpty());
    }

    // TEST 4: TUTOR PUEDE ELIMINAR EVENTO AJENO

    @Test
    void tutorPuedeEliminarEventoAjeno() throws Exception {

        String eventoId = crearEvento(familiar);

        mockMvc.perform(delete(rutaEventos() + "/" + eventoId)
                .header("Authorization", token(tutor)))
                .andExpect(status().isNoContent());

        assertFalse(eventoRepository.findById(
                UUID.fromString(eventoId)).isPresent());
    }

    // TEST 5: EL AUTOR PUEDE EDITAR SU EVENTO

    @Test
    void autorPuedeEditarSuEvento() throws Exception {

        String eventoId = crearEvento(docente);

        String requestEditado = """
                {
                  "titulo": "Visita reprogramada",
                  "descripcion": "Nuevo horario",
                  "fecha": "2026-11-06",
                  "horaInicio": "11:00",
                  "horaFin": "13:00",
                  "imagenId": null
                }
                """;

        mockMvc.perform(put(rutaEventos() + "/" + eventoId)
                .header("Authorization", token(docente))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestEditado))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo")
                        .value("Visita reprogramada"))
                .andExpect(jsonPath("$.fecha")
                        .value("2026-11-06"));
    }

    // TEST 6: LISTAR EVENTOS POR FECHA

    @Test
    void listarEventosDentroDelRango() throws Exception {

        crearEvento(familiar);

        mockMvc.perform(get(rutaEventos())
                .param("desde", "2026-11-01")
                .param("hasta", "2026-11-30")
                .header("Authorization", token(docente)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].titulo")
                        .value("Visita al museo"));
    }

    // TEST 7: HORARIOS INVÁLIDOS

    @Test
    void rechazarHorarioFinAnteriorAlInicio() throws Exception {

        String request = """
                {
                  "titulo": "Evento inválido",
                  "fecha": "2026-11-05",
                  "horaInicio": "12:00",
                  "horaFin": "10:00"
                }
                """;

        mockMvc.perform(post(rutaEventos())
                .header("Authorization", token(tutor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isBadRequest());
    }

    // MÉTODOS AUXILIARES

    private String crearEvento(Usuario autor) throws Exception {

        String respuesta = mockMvc.perform(post(rutaEventos())
                .header("Authorization", token(autor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestValido()))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return mapper.readTree(respuesta).get("id").asText();
    }

    private String requestValido() {
        return """
                {
                  "titulo": "Visita al museo",
                  "descripcion": "Actividad de prueba",
                  "fecha": "2026-11-05",
                  "horaInicio": "10:00",
                  "horaFin": "12:00",
                  "imagenId": null
                }
                """;
    }

    private Usuario crearUsuario(String nombre) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre)
                .apellido("Prueba")
                .email(nombre.toLowerCase() + "."
                        + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }

    private void crearMembresia(
            Usuario usuario, Rol rol, boolean esAdmin) {

        membresiaRepository.save(Membresia.builder()
                .usuario(usuario)
                .proyecto(proyecto)
                .rol(rol)
                .esAdmin(esAdmin)
                .build());
    }

    private String rutaEventos() {
        return "/api/proyectos/" + proyecto.getId() + "/eventos";
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}