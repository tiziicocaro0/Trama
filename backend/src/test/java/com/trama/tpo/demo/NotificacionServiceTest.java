package com.trama.tpo.demo;

import com.trama.tpo.demo.entity.notificacion.Notificacion;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.NotificacionRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.NotificacionService;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NotificacionServiceTest {

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

    private UUID registrarUsuario() throws Exception {
        String email = "notif.test." + UUID.randomUUID()
                + "@example.com";

        String registro = """
                {
                    "nombre": "Usuario",
                    "apellido": "Prueba",
                    "email": "%s",
                    "password": "Prueba123!"
                }
                """.formatted(email);

        mockMvc.perform(
                        post("/api/auth/registro")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(registro))
                .andExpect(status().isCreated());

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new AssertionError(
                        "No se encontró el usuario registrado: " + email));

        UUID usuarioId = usuario.getId();

        usuariosDePrueba.add(usuarioId);

        return usuarioId;
    }

    @AfterEach
    void limpiarDatos() {
        for (UUID usuarioId : usuariosDePrueba) {
            List<Notificacion> notificaciones =
                    notificacionRepository
                            .findByUsuarioIdOrderByFechaDesc(
                                    usuarioId,
                                    org.springframework.data.domain
                                            .PageRequest.of(0, 100));

            notificacionRepository.deleteAll(notificaciones);

            usuarioRepository.findById(usuarioId)
                    .ifPresent(usuarioRepository::delete);
        }

        usuariosDePrueba.clear();
    }

    @Test
    void notificarTresUsuariosCreaTresNotificacionesSinLeer()
            throws Exception {

        UUID usuario1 = registrarUsuario();
        UUID usuario2 = registrarUsuario();
        UUID usuario3 = registrarUsuario();

        notificacionService.notificar(
                List.of(usuario1, usuario2, usuario3),
                null,
                "NOVEDAD",
                "Hay una nueva actualización",
                "/proyectos"
        );

        for (UUID usuarioId : usuariosDePrueba) {
            assertEquals(
                    1,
                    notificacionRepository
                            .countByUsuarioIdAndLeidaFalse(usuarioId)
            );

            List<Notificacion> notificaciones =
                    notificacionRepository
                            .findByUsuarioIdOrderByFechaDesc(
                                    usuarioId,
                                    org.springframework.data.domain
                                            .PageRequest.of(0, 10));

            assertEquals(1, notificaciones.size());
            assertFalse(notificaciones.get(0).getLeida());
        }
    }
}