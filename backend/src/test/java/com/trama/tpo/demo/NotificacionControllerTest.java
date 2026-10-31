package com.trama.tpo.demo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.entity.notificacion.Notificacion;
import com.trama.tpo.demo.repository.NotificacionRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.NotificacionService;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NotificacionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private NotificacionRepository notificacionRepository;

    @Autowired
    private NotificacionService notificacionService;

    private final List<UUID> usuariosDePrueba = new ArrayList<>();

    private record UsuarioPrueba(UUID id, String token) {}

    private UsuarioPrueba registrarUsuario() throws Exception {
        String email = "notif.controller." + UUID.randomUUID()
                + "@example.com";

        String registro = """
                {
                    "nombre": "Usuario",
                    "apellido": "Prueba",
                    "email": "%s",
                    "password": "Prueba123!"
                }
                """.formatted(email);

        String respuesta = mockMvc.perform(
                        post("/api/auth/registro")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(registro))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(respuesta);
        String token = json.get("access_token").asText();

        UUID id = usuarioRepository.findByEmail(email)
                .orElseThrow()
                .getId();

        usuariosDePrueba.add(id);

        return new UsuarioPrueba(id, token);
    }

    @AfterEach
    void limpiarDatos() {
        for (UUID usuarioId : usuariosDePrueba) {
            List<Notificacion> notificaciones =
                    notificacionRepository.findByUsuarioIdOrderByFechaDesc(
                            usuarioId, PageRequest.of(0, 100));

            notificacionRepository.deleteAll(notificaciones);

            usuarioRepository.findById(usuarioId)
                    .ifPresent(usuarioRepository::delete);
        }

        usuariosDePrueba.clear();
    }

    @Test
    void listarDevuelveSoloNotificacionesPropias() throws Exception {
        UsuarioPrueba ana = registrarUsuario();
        UsuarioPrueba juan = registrarUsuario();

        notificacionService.notificar(
                List.of(ana.id()),
                null,
                "NOVEDAD",
                "Notificacion de Ana",
                "/proyectos"
        );

        notificacionService.notificar(
                List.of(juan.id()),
                null,
                "NOVEDAD",
                "Notificacion de Juan",
                "/proyectos"
        );

        mockMvc.perform(get("/api/notificaciones")
                        .header("Authorization", "Bearer " + ana.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].texto")
                        .value("Notificacion de Ana"));
    }

    @Test
    void contadorDevuelveCantidadSinLeer() throws Exception {
        UsuarioPrueba ana = registrarUsuario();

        notificacionService.notificar(
                List.of(ana.id()),
                null,
                "NOVEDAD",
                "Primera notificacion",
                "/proyectos"
        );

        notificacionService.notificar(
                List.of(ana.id()),
                null,
                "NOVEDAD",
                "Segunda notificacion",
                "/proyectos"
        );

        mockMvc.perform(get("/api/notificaciones/no-leidas/count")
                        .header("Authorization", "Bearer " + ana.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(2));
    }

    @Test
    void listarSinTokenDevuelve401() throws Exception {
        mockMvc.perform(get("/api/notificaciones"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void marcarUnaNotificacionComoLeida() throws Exception {
        UsuarioPrueba ana = registrarUsuario();

        notificacionService.notificar(
                List.of(ana.id()), null,
                "NOVEDAD", "Nueva notificacion", "/proyectos"
        );

        Notificacion notificacion = notificacionRepository
                .findByUsuarioIdOrderByFechaDesc(
                        ana.id(), PageRequest.of(0, 10))
                .get(0);

        mockMvc.perform(put("/api/notificaciones/"
                        + notificacion.getId() + "/leida")
                        .header("Authorization", "Bearer " + ana.token()))
                .andExpect(status().isNoContent());

        assertEquals(0,
                notificacionRepository
                        .countByUsuarioIdAndLeidaFalse(ana.id()));
    }

    @Test
    void marcarTodasLasNotificacionesComoLeidas() throws Exception {
        UsuarioPrueba ana = registrarUsuario();

        notificacionService.notificar(
                List.of(ana.id()), null,
                "NOVEDAD", "Primera", "/proyectos"
        );

        notificacionService.notificar(
                List.of(ana.id()), null,
                "NOVEDAD", "Segunda", "/proyectos"
        );

        mockMvc.perform(put("/api/notificaciones/leer-todas")
                        .header("Authorization", "Bearer " + ana.token()))
                .andExpect(status().isNoContent());

        assertEquals(0,
                notificacionRepository
                        .countByUsuarioIdAndLeidaFalse(ana.id()));
    }

    @Test
    void noPermiteMarcarNotificacionAjena() throws Exception {
        UsuarioPrueba ana = registrarUsuario();
        UsuarioPrueba juan = registrarUsuario();

        notificacionService.notificar(
                List.of(juan.id()), null,
                "NOVEDAD", "Notificacion privada", "/proyectos"
        );

        Notificacion notificacion = notificacionRepository
                .findByUsuarioIdOrderByFechaDesc(
                        juan.id(), PageRequest.of(0, 10))
                .get(0);

        mockMvc.perform(put("/api/notificaciones/"
                        + notificacion.getId() + "/leida")
                        .header("Authorization", "Bearer " + ana.token()))
                .andExpect(status().isNotFound());

        assertEquals(1,
                notificacionRepository
                        .countByUsuarioIdAndLeidaFalse(juan.id()));
    }

    @Test
    void listarDevuelveComoMaximoDiezNotificaciones()
            throws Exception {

        UsuarioPrueba ana = registrarUsuario();

        for (int i = 1; i <= 12; i++) {
            notificacionService.notificar(
                    List.of(ana.id()), null,
                    "NOVEDAD", "Notificacion " + i, "/proyectos"
            );
        }

        mockMvc.perform(get("/api/notificaciones")
                        .header("Authorization", "Bearer " + ana.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(10));

        assertEquals(12,
                notificacionRepository
                        .countByUsuarioIdAndLeidaFalse(ana.id()));
    }
}