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

    // Usuario de prueba creado directo en la base
    // (el registro por API ahora pide tipo de cuenta y el código del mail).
    private UUID registrarUsuario() {
        Usuario usuario = usuarioRepository.save(Usuario.builder()
                .nombre("Usuario")
                .apellido("Prueba")
                .email("notif.service." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());

        usuariosDePrueba.add(usuario.getId());

        return usuario.getId();
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