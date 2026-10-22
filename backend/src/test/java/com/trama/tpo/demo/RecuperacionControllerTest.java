package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.trama.tpo.demo.entity.usuario.TokenRecuperacion;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.TokenRecuperacionRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.EmailService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties =
        "trama.recuperacion.url-base=https://trama.example/restablecer")
class RecuperacionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private TokenRecuperacionRepository tokenRecuperacionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Simula el envio: no utiliza Mailpit ni envia emails reales.
    @MockBean
    private EmailService emailService;

    private Usuario usuario;

    @BeforeEach
    void prepararDatos() {

        usuario = usuarioRepository.save(Usuario.builder()
                .nombre("Nora")
                .apellido("Prueba")
                .email("recuperacion." + UUID.randomUUID() + "@example.com")
                .passwordHash(passwordEncoder.encode("ClaveVieja123!"))
                .build());
    }

    @AfterEach
    void limpiarDatos() {

        tokenRecuperacionRepository.findAll().stream()
                .filter(token -> token.getUsuario().getId().equals(usuario.getId()))
                .forEach(tokenRecuperacionRepository::delete);

        tokenRecuperacionRepository.flush();

        usuarioRepository.delete(usuario);
    }

    @Test
    void solicitarRecuperacionConEmailExistenteGeneraTokenYEnviaMail() throws Exception {

        String request = """
                { "email": "%s" }
                """.formatted(usuario.getEmail());

        mockMvc.perform(post("/api/auth/recuperar")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").exists());

        verify(emailService).enviarRecuperacion(
                eq(usuario.getEmail()),
                contains("?token=")
        );
    }

    @Test
    void solicitarRecuperacionConEmailInexistenteDevuelveElMismoMensaje() throws Exception {

        String request = """
                { "email": "no-existe-nunca@example.com" }
                """;

        mockMvc.perform(post("/api/auth/recuperar")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").exists());

        // No debe filtrarse si el email existe o no: no se envia ningun correo.
        verifyNoInteractions(emailService);
    }

    @Test
    void restablecerConTokenValidoPermiteElegirNuevaContrasena() throws Exception {

        String tokenPlano = "token-de-prueba-valido";

        TokenRecuperacion token = tokenRecuperacionRepository.saveAndFlush(
                TokenRecuperacion.builder()
                        .usuario(usuario)
                        .tokenHash(sha256(tokenPlano))
                        .venceEn(Instant.now().plus(30, ChronoUnit.MINUTES))
                        .build()
        );

        String request = """
                { "token": "%s", "password": "NuevaClave123!" }
                """.formatted(tokenPlano);

        mockMvc.perform(post("/api/auth/restablecer")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").exists());

        Usuario actualizado = usuarioRepository.findById(usuario.getId()).orElseThrow();
        assertTrue(passwordEncoder.matches("NuevaClave123!", actualizado.getPasswordHash()));

        TokenRecuperacion usado = tokenRecuperacionRepository.findById(token.getId()).orElseThrow();
        assertNotNull(usado.getUsadoEn());
    }

    @Test
    void restablecerConTokenInvalidoRechaza() throws Exception {

        String request = """
                { "token": "esto-no-existe", "password": "NuevaClave123!" }
                """;

        mockMvc.perform(post("/api/auth/restablecer")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("TOKEN_INVALIDO"));
    }

    @Test
    void restablecerConContrasenaDebilRechaza() throws Exception {

        String tokenPlano = "token-para-clave-debil";

        tokenRecuperacionRepository.saveAndFlush(
                TokenRecuperacion.builder()
                        .usuario(usuario)
                        .tokenHash(sha256(tokenPlano))
                        .venceEn(Instant.now().plus(30, ChronoUnit.MINUTES))
                        .build()
        );

        String request = """
                { "token": "%s", "password": "sinmayuscula1!" }
                """.formatted(tokenPlano);

        mockMvc.perform(post("/api/auth/restablecer")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("DATOS_INVALIDOS"));

        Usuario sinCambios = usuarioRepository.findById(usuario.getId()).orElseThrow();
        assertTrue(passwordEncoder.matches("ClaveVieja123!", sinCambios.getPasswordHash()));
    }

    private static String sha256(String token) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }
}
