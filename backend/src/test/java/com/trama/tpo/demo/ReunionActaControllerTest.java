package com.trama.tpo.demo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.EventoExcepcionRepository;
import com.trama.tpo.demo.repository.EventoRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReunionActaControllerTest {

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
    private Usuario familiarNoParticipante;
    private Proyecto proyecto;

    @BeforeEach
    void prepararDatos() {
        tutor = crearUsuario("Tutor");
        docente = crearUsuario("Docente");
        familiarNoParticipante = crearUsuario("Familiar");

        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Tomás")
                .apellido("Fernández")
                .fechaNacimiento(LocalDate.of(2017, 5, 12))
                .escuela("Escuela N.º 12")
                .grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());

        crearMembresia(tutor, Rol.TUTOR, true);
        crearMembresia(docente, Rol.EDUCACION, false);
        crearMembresia(familiarNoParticipante, Rol.FAMILIAR, false);
    }

    @AfterEach
    void limpiarDatos() {
        excepcionRepository.deleteAll();
        eventoRepository.deleteAll();
        membresiaRepository.deleteAll(
                membresiaRepository.findByProyectoId(proyecto.getId()));
        proyectoRepository.delete(proyecto);
        usuarioRepository.deleteAll(List.of(tutor, docente, familiarNoParticipante));
    }

    @Test
    void crearReunionConParticipantesYGuardarActaSiendoParticipante() throws Exception {
        String bodyCrear = mapper.writeValueAsString(Map.of(
                "titulo", "Reunión de seguimiento escolar",
                "descripcion", "Alinear objetivos del 2do trimestre",
                "fecha", "2026-11-10",
                "horaInicio", "10:00",
                "horaFin", "11:00",
                "tipo", "REUNION",
                "participanteIds", List.of(docente.getId().toString())
        ));

        String respuestaJson = mockMvc.perform(post(rutaEventos())
                .header("Authorization", token(tutor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(bodyCrear))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipo").value("REUNION"))
                .andExpect(jsonPath("$.participanteIds.length()").value(1))
                .andReturn().getResponse().getContentAsString();

        String eventoId = mapper.readTree(respuestaJson).get("id").asText();

        // 1. Docente (participante) puede guardar el acta
        String bodyActa = mapper.writeValueAsString(Map.of(
                "acta", "Acordamos anticipar los cambios de aula con pictogramas."
        ));

        mockMvc.perform(put(rutaEventos() + "/" + eventoId + "/acta")
                .header("Authorization", token(docente))
                .contentType(MediaType.APPLICATION_JSON)
                .content(bodyActa))
                .andExpect(status().isNoContent());

        // Verificamos que al listar el evento, se vea el acta guardada
        mockMvc.perform(get(rutaEventos())
                .param("desde", "2026-11-01")
                .param("hasta", "2026-11-30")
                .header("Authorization", token(tutor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tipo").value("REUNION"))
                .andExpect(jsonPath("$[0].acta").value("Acordamos anticipar los cambios de aula con pictogramas."));
    }

    @Test
    void rechazaGuardarActaSiElUsuarioNoEsParticipante() throws Exception {
        // Tutor crea reunión sólo con docente (familiarNoParticipante NO está en la reunión)
        String bodyCrear = mapper.writeValueAsString(Map.of(
                "titulo", "Reunión de equipo docente",
                "fecha", "2026-11-12",
                "horaInicio", "09:00",
                "horaFin", "10:00",
                "tipo", "REUNION",
                "participanteIds", List.of(docente.getId().toString())
        ));

        String respuestaJson = mockMvc.perform(post(rutaEventos())
                .header("Authorization", token(tutor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(bodyCrear))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String eventoId = mapper.readTree(respuestaJson).get("id").asText();

        String bodyActa = mapper.writeValueAsString(Map.of(
                "acta", "Intento de acta por no participante"
        ));

        // familiarNoParticipante intenta cargar acta -> 403 Forbidden
        mockMvc.perform(put(rutaEventos() + "/" + eventoId + "/acta")
                .header("Authorization", token(familiarNoParticipante))
                .contentType(MediaType.APPLICATION_JSON)
                .content(bodyActa))
                .andExpect(status().isForbidden());
    }

    private Usuario crearUsuario(String nombre) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre)
                .apellido("Prueba")
                .email(nombre.toLowerCase() + "." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }

    private void crearMembresia(Usuario usuario, Rol rol, boolean esAdmin) {
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

