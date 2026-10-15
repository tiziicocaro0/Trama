package com.trama.tpo.demo;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.UsuarioRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LoginBloqueoTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    private final List<String> emailsDePrueba = new ArrayList<>();

    // Generar emails únicos para cada prueba
    private String nuevoEmail() {

        String email = "ana.bloqueo." + UUID.randomUUID()
                + "@example.com";

        emailsDePrueba.add(email);

        return email;
    }

    // Eliminar los usuarios creados al finalizar cada prueba
    @AfterEach
    void limpiarUsuariosDePrueba() {

        for (String email : emailsDePrueba) {

            usuarioRepository.findByEmail(email)
                    .ifPresent(usuarioRepository::delete);
        }

        emailsDePrueba.clear();
    }

    // TEST 1: BLOQUEAR DESPUÉS DE CINCO INTENTOS FALLIDOS
    @Test
    void bloquearCuentaDespuesDeCincoIntentos() throws Exception {

        String email = nuevoEmail();

        String registro = """
            {
                "nombre": "Ana",
                "apellido": "Prueba",
                "email": "%s",
                "password": "Prueba123!"
            }
            """.formatted(email);

        String loginIncorrecto = """
            {
                "email": "%s",
                "password": "Incorrecta123!"
            }
            """.formatted(email);

        // Registrar usuario
        mockMvc.perform(post("/api/auth/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registro))
                .andExpect(status().isCreated());

        // Primeros cuatro intentos incorrectos: HTTP 401
        for (int i = 0; i < 4; i++) {

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(loginIncorrecto))
                    .andExpect(status().isUnauthorized());
        }

        // Quinto intento incorrecto: HTTP 429
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginIncorrecto))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.codigo")
                        .value("CUENTA_BLOQUEADA"));

        // La cuenta sigue bloqueada con la contraseña correcta
        String loginCorrecto = """
            {
                "email": "%s",
                "password": "Prueba123!"
            }
            """.formatted(email);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginCorrecto))
                .andExpect(status().isTooManyRequests());
    }

    // TEST 2: REINICIAR CONTADOR DESPUÉS DE LOGIN EXITOSO
    @Test
    void reiniciarIntentosDespuesDeLoginExitoso() throws Exception {

        String email = nuevoEmail();

        String registro = """
            {
                "nombre": "Ana",
                "apellido": "Prueba",
                "email": "%s",
                "password": "Prueba123!"
            }
            """.formatted(email);

        String loginIncorrecto = """
            {
                "email": "%s",
                "password": "Incorrecta123!"
            }
            """.formatted(email);

        String loginCorrecto = """
            {
                "email": "%s",
                "password": "Prueba123!"
            }
            """.formatted(email);

        // Registrar usuario
        mockMvc.perform(post("/api/auth/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registro))
                .andExpect(status().isCreated());

        // Tres intentos incorrectos
        for (int i = 0; i < 3; i++) {

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(loginIncorrecto))
                    .andExpect(status().isUnauthorized());
        }

        // Login correcto: reinicia el contador
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginCorrecto))
                .andExpect(status().isOk());

        // Cuatro nuevos intentos incorrectos: HTTP 401
        for (int i = 0; i < 4; i++) {

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(loginIncorrecto))
                    .andExpect(status().isUnauthorized());
        }

        // Quinto nuevo intento incorrecto: HTTP 429
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginIncorrecto))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.codigo")
                        .value("CUENTA_BLOQUEADA"));
    }

    // TEST 3: PERMITIR LOGIN DESPUÉS DE 15 MINUTOS
    @Test
    void permitirLoginDespuesDeQuinceMinutos() throws Exception {

        String email = nuevoEmail();

        String registro = """
            {
                "nombre": "Ana",
                "apellido": "Prueba",
                "email": "%s",
                "password": "Prueba123!"
            }
            """.formatted(email);

        String loginIncorrecto = """
            {
                "email": "%s",
                "password": "Incorrecta123!"
            }
            """.formatted(email);

        String loginCorrecto = """
            {
                "email": "%s",
                "password": "Prueba123!"
            }
            """.formatted(email);

        // Registrar usuario
        mockMvc.perform(post("/api/auth/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registro))
                .andExpect(status().isCreated());

        // Cuatro intentos incorrectos: HTTP 401
        for (int i = 0; i < 4; i++) {

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(loginIncorrecto))
                    .andExpect(status().isUnauthorized());
        }

        // Quinto intento: bloqueo
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginIncorrecto))
                .andExpect(status().isTooManyRequests());

        // Simular que pasaron los 15 minutos
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow();

        usuario.setBloqueadoHasta(
                Instant.now().minus(1, ChronoUnit.MINUTES)
        );

        usuarioRepository.saveAndFlush(usuario);

        // Login correcto después del bloqueo
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginCorrecto))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access_token").isNotEmpty());

        // Comprobar que se reinició el contador
        Usuario actualizado = usuarioRepository.findByEmail(email)
                .orElseThrow();

        assertEquals(0, actualizado.getIntentosFallidos());
        assertNull(actualizado.getBloqueadoHasta());
    }

    // TEST 4: REINICIAR INTENTOS AL VENCER EL BLOQUEO
    @Test
    void reiniciarIntentosCuandoVenceBloqueo() throws Exception {

        String email = nuevoEmail();

        String registro = """
            {
                "nombre": "Ana",
                "apellido": "Prueba",
                "email": "%s",
                "password": "Prueba123!"
            }
            """.formatted(email);

        String loginIncorrecto = """
            {
                "email": "%s",
                "password": "Incorrecta123!"
            }
            """.formatted(email);

        // Registrar usuario
        mockMvc.perform(post("/api/auth/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registro))
                .andExpect(status().isCreated());

        // Cuatro intentos incorrectos
        for (int i = 0; i < 4; i++) {
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(loginIncorrecto))
                    .andExpect(status().isUnauthorized());
        }

        // Quinto intento: bloqueo
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginIncorrecto))
                .andExpect(status().isTooManyRequests());

        // Simular que vencieron los 15 minutos
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow();

        usuario.setBloqueadoHasta(
                Instant.now().minus(1, ChronoUnit.MINUTES)
        );

        usuarioRepository.saveAndFlush(usuario);

        // Nueva contraseña incorrecta: debe devolver 401
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginIncorrecto))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje")
                        .value("Email o contraseña inválidos"));

        // El contador debe ser 1, no 6
        Usuario actualizado = usuarioRepository.findByEmail(email)
                .orElseThrow();

        assertEquals(1, actualizado.getIntentosFallidos());
        assertNull(actualizado.getBloqueadoHasta());
    }
}