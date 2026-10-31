package com.trama.tpo.demo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.*;

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

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EventoRecurrenteControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private EventoRepository eventoRepository;
    @Autowired private EventoExcepcionRepository excepcionRepository;

    private final ObjectMapper mapper = new ObjectMapper();
    private Usuario tutor;
    private Usuario docente;
    private Usuario familiar;
    private Proyecto proyecto;

    @BeforeEach
    void prepararDatos() {
        tutor = crearUsuario("TutorRecurrencia");
        docente = crearUsuario("DocenteRecurrencia");
        familiar = crearUsuario("FamiliarRecurrencia");

        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Mateo")
                .apellido("Recurrencia")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba")
                .grado("3 grado")
                .consentimientoFecha(Instant.now())
                .build());

        crearMembresia(tutor, Rol.TUTOR, true);
        crearMembresia(docente, Rol.EDUCACION, false);
        crearMembresia(familiar, Rol.FAMILIAR, false);
    }

    @AfterEach
    void limpiarDatos() {
        if (proyecto != null) {
            var eventos = eventoRepository
                    .findByProyectoIdAndFechaBetweenOrderByFechaAscHoraInicioAsc(
                            proyecto.getId(),
                            LocalDate.of(1900, 1, 1),
                            LocalDate.of(9999, 12, 31));

            // Eliminar excepciones antes de sus eventos.
            for (var evento : eventos) {
                excepcionRepository.deleteAll(
                        excepcionRepository
                                .findByEventoIdAndFechaOcurrenciaBetween(
                                        evento.getId(),
                                        LocalDate.of(1900, 1, 1),
                                        LocalDate.of(9999, 12, 31)));
            }

            eventoRepository.deleteAll(eventos);
            membresiaRepository.deleteAll(
                    membresiaRepository.findByProyectoId(proyecto.getId()));
            proyectoRepository.delete(proyecto);
        }

        usuarioRepository.deleteAll(List.of(tutor, docente, familiar));
    }

    // TEST 1: CUATRO MARTES EN CUATRO SEMANAS
    @Test
    void eventoDeMartesApareceCuatroVeces() throws Exception {
        crearEventoRecurrente(docente);

        mockMvc.perform(get(rutaEventos())
                .param("desde", "2026-11-03")
                .param("hasta", "2026-11-24")
                .header("Authorization", token(docente)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[0].fechaOcurrencia")
                        .value("2026-11-03"))
                .andExpect(jsonPath("$[1].fechaOcurrencia")
                        .value("2026-11-10"))
                .andExpect(jsonPath("$[2].fechaOcurrencia")
                        .value("2026-11-17"))
                .andExpect(jsonPath("$[3].fechaOcurrencia")
                        .value("2026-11-24"));
    }

    // TEST 2: CANCELAR SOLO UNA OCURRENCIA
    @Test
    void cancelarUnMartesMantieneLosOtros() throws Exception {
        String id = crearEventoRecurrente(docente);

        mockMvc.perform(delete(rutaOcurrencia(id, "2026-11-10"))
                .header("Authorization", token(docente)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get(rutaEventos())
                .param("desde", "2026-11-03")
                .param("hasta", "2026-11-24")
                .header("Authorization", token(docente)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].fechaOcurrencia")
                        .value("2026-11-03"))
                .andExpect(jsonPath("$[1].fechaOcurrencia")
                        .value("2026-11-17"))
                .andExpect(jsonPath("$[2].fechaOcurrencia")
                        .value("2026-11-24"));
    }

    // TEST 3: EDITAR SOLO UNA OCURRENCIA
    @Test
    void editarUnMartesNoModificaLosOtros() throws Exception {
        String id = crearEventoRecurrente(docente);

        String cambio = """
                {
                  "titulo": "Terapia reprogramada",
                  "horaInicio": "15:00",
                  "horaFin": "16:00"
                }
                """;

        mockMvc.perform(put(rutaOcurrencia(id, "2026-11-10"))
                .header("Authorization", token(docente))
                .contentType(MediaType.APPLICATION_JSON)
                .content(cambio))
                .andExpect(status().isNoContent());

        mockMvc.perform(get(rutaEventos())
                .param("desde", "2026-11-03")
                .param("hasta", "2026-11-24")
                .header("Authorization", token(docente)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[0].titulo")
                        .value("Terapia semanal"))
                .andExpect(jsonPath("$[1].titulo")
                        .value("Terapia reprogramada"))
                .andExpect(jsonPath("$[1].horaInicio")
                        .value("15:00:00"))
                .andExpect(jsonPath("$[2].titulo")
                        .value("Terapia semanal"));
    }

    // TEST 4: DOCENTE NO PUEDE CANCELAR EVENTO AJENO
    @Test
    void docenteNoPuedeCancelarOcurrenciaAjena() throws Exception {
        String id = crearEventoRecurrente(familiar);

        mockMvc.perform(delete(rutaOcurrencia(id, "2026-11-10"))
                .header("Authorization", token(docente)))
                .andExpect(status().isForbidden());
    }

    // TEST 5: TUTOR PUEDE CANCELAR EVENTO AJENO
    @Test
    void tutorPuedeCancelarOcurrenciaAjena() throws Exception {
        String id = crearEventoRecurrente(familiar);

        mockMvc.perform(delete(rutaOcurrencia(id, "2026-11-10"))
                .header("Authorization", token(tutor)))
                .andExpect(status().isNoContent());
    }

    // TEST 6: FECHA QUE NO PERTENECE A LA SERIE
    @Test
    void cancelarUnMiercolesDevuelve400() throws Exception {
        String id = crearEventoRecurrente(docente);

        mockMvc.perform(delete(rutaOcurrencia(id, "2026-11-11"))
                .header("Authorization", token(docente)))
                .andExpect(status().isBadRequest());
    }

    // TEST 7: CAMBIAR LA SERIE ELIMINA EXCEPCIONES ANTERIORES
    @Test
    void cambiarDeMartesAJuevesEliminaExcepciones() throws Exception {
        String id = crearEventoRecurrente(docente);

        // Cancelar el martes 10 de noviembre.
        mockMvc.perform(delete(rutaOcurrencia(id, "2026-11-10"))
                .header("Authorization", token(docente)))
                .andExpect(status().isNoContent());

        // Cambiar toda la serie para que ocurra los jueves.
        String cambio = """
                {
                  "titulo": "Terapia semanal",
                  "descripcion": "Actividad recurrente",
                  "fecha": "2026-11-05",
                  "horaInicio": "10:00",
                  "horaFin": "11:00",
                  "recurrente": true,
                  "diaSemana": 4,
                  "fechaFinRecurrencia": "2026-11-26"
                }
                """;

        mockMvc.perform(put(rutaEventos() + "/" + id)
                .header("Authorization", token(docente))
                .contentType(MediaType.APPLICATION_JSON)
                .content(cambio))
                .andExpect(status().isOk());

        // Las excepciones de los martes deben desaparecer.
        assertTrue(excepcionRepository
                .findByEventoIdAndFechaOcurrenciaBetween(
                        UUID.fromString(id),
                        LocalDate.of(2026, 11, 1),
                        LocalDate.of(2026, 11, 30))
                .isEmpty());

        // Ahora deben aparecer cuatro jueves.
        mockMvc.perform(get(rutaEventos())
                .param("desde", "2026-11-01")
                .param("hasta", "2026-11-30")
                .header("Authorization", token(docente)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[0].fechaOcurrencia")
                        .value("2026-11-05"))
                .andExpect(jsonPath("$[1].fechaOcurrencia")
                        .value("2026-11-12"))
                .andExpect(jsonPath("$[2].fechaOcurrencia")
                        .value("2026-11-19"))
                .andExpect(jsonPath("$[3].fechaOcurrencia")
                        .value("2026-11-26"));
    }

    private String crearEventoRecurrente(Usuario autor) throws Exception {
        String request = """
                {
                  "titulo": "Terapia semanal",
                  "descripcion": "Actividad recurrente",
                  "fecha": "2026-11-03",
                  "horaInicio": "10:00",
                  "horaFin": "11:00",
                  "recurrente": true,
                  "diaSemana": 2,
                  "fechaFinRecurrencia": "2026-11-24"
                }
                """;

        String respuesta = mockMvc.perform(post(rutaEventos())
                .header("Authorization", token(autor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return mapper.readTree(respuesta).get("id").asText();
    }

    private Usuario crearUsuario(String nombre) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre)
                .apellido("Prueba")
                .email(nombre.toLowerCase() + "."
                        + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-tests")
                .build());
    }

    private void crearMembresia(Usuario usuario, Rol rol, boolean admin) {
        membresiaRepository.save(Membresia.builder()
                .usuario(usuario)
                .proyecto(proyecto)
                .rol(rol)
                .esAdmin(admin)
                .build());
    }

    private String rutaEventos() {
        return "/api/proyectos/" + proyecto.getId() + "/eventos";
    }

    private String rutaOcurrencia(String id, String fecha) {
        return rutaEventos() + "/" + id + "/ocurrencias/" + fecha;
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}