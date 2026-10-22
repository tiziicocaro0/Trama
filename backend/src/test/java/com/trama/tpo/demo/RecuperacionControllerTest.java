package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.TokenRecuperacionRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.EmailService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RecuperacionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private TokenRecuperacionRepository tokenRecuperacionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Simula el envio: no se manda ningun mail real.
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

        tokenRecuperacionRepository.deleteAll(
                tokenRecuperacionRepository.findAll().stream()
                        .filter(t -> t.getUsuario().getId().equals(usuario.getId()))
                        .toList());
        tokenRecuperacionRepository.flush();
        usuarioRepository.delete(usuario);
    }

    @Test
    void flujoCompletoEmailCodigoYNuevaContrasena() throws Exception {

        String codigo = pedirCodigo();

        mockMvc.perform(post("/api/auth/verificar-codigo")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        { "email": "%s", "codigo": "%s" }
                        """.formatted(usuario.getEmail(), codigo)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/restablecer")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        { "email": "%s", "codigo": "%s", "password": "NuevaClave123!" }
                        """.formatted(usuario.getEmail(), codigo)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").exists());

        Usuario actualizado = usuarioRepository.findById(usuario.getId()).orElseThrow();
        assertTrue(passwordEncoder.matches("NuevaClave123!", actualizado.getPasswordHash()));

        // El codigo es de un solo uso.
        mockMvc.perform(post("/api/auth/verificar-codigo")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        { "email": "%s", "codigo": "%s" }
                        """.formatted(usuario.getEmail(), codigo)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("CODIGO_INVALIDO"));
    }

    @Test
    void emailInexistenteRecibeElMismoMensajeYNoSeEnviaMail() throws Exception {

        mockMvc.perform(post("/api/auth/recuperar")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{ \"email\": \"no-existe-nunca@example.com\" }"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value(
                        "Si el email está registrado, te enviamos un código de 6 dígitos."));

        verifyNoInteractions(emailService);
    }

    @Test
    void cincoIntentosFallidosBloqueanElCodigo() throws Exception {

        String codigo = pedirCodigo();
        String incorrecto = codigo.equals("000000") ? "111111" : "000000";

        for (int i = 0; i < 4; i++) {
            mockMvc.perform(post("/api/auth/verificar-codigo")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            { "email": "%s", "codigo": "%s" }
                            """.formatted(usuario.getEmail(), incorrecto)))
                    .andExpect(status().isBadRequest());
        }

        mockMvc.perform(post("/api/auth/verificar-codigo")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        { "email": "%s", "codigo": "%s" }
                        """.formatted(usuario.getEmail(), incorrecto)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.codigo").value("CODIGO_BLOQUEADO"));

        // Ni siquiera el codigo correcto sirve despues del bloqueo.
        mockMvc.perform(post("/api/auth/verificar-codigo")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        { "email": "%s", "codigo": "%s" }
                        """.formatted(usuario.getEmail(), codigo)))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void contrasenaDebilSeRechazaYNoCambiaNada() throws Exception {

        String codigo = pedirCodigo();

        mockMvc.perform(post("/api/auth/restablecer")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        { "email": "%s", "codigo": "%s", "password": "sinmayuscula1!" }
                        """.formatted(usuario.getEmail(), codigo)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("DATOS_INVALIDOS"));

        Usuario sinCambios = usuarioRepository.findById(usuario.getId()).orElseThrow();
        assertTrue(passwordEncoder.matches("ClaveVieja123!", sinCambios.getPasswordHash()));
    }

    // Pide el codigo y lo recupera del mail simulado.
    private String pedirCodigo() throws Exception {

        mockMvc.perform(post("/api/auth/recuperar")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{ \"email\": \"%s\" }".formatted(usuario.getEmail())))
                .andExpect(status().isOk());

        ArgumentCaptor<String> codigo = ArgumentCaptor.forClass(String.class);
        verify(emailService).enviarCodigoRecuperacion(
                eq(usuario.getEmail()), codigo.capture(), anyInt());
        return codigo.getValue();
    }
}
