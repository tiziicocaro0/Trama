package com.trama.tpo.demo;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.trama.tpo.demo.repository.CodigoVerificacionRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.EmailService;

// Registro: la cuenta entra recién al confirmar el código de 6 dígitos que llega por mail.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class VerificacionEmailTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private CodigoVerificacionRepository codigoRepository;
    @MockBean private EmailService emailService;

    private final String email = "nueva." + UUID.randomUUID() + "@example.com";

    @AfterEach
    void limpiarDatos() {
        usuarioRepository.findByEmail(email).ifPresent(usuarioRepository::delete);
    }

    @Test
    void conElCodigoDelMailLaCuentaQuedaActivaYEntra() throws Exception {
        String codigo = registrar();

        login().andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo").value("EMAIL_NO_VERIFICADO"));

        verificar(codigo)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access_token").isNotEmpty());

        login().andExpect(status().isOk());
        verificar(codigo).andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("EMAIL_YA_VERIFICADO"));
    }

    @Test
    void unCodigoEquivocadoNoActivaYAlQuintoSeBloquea() throws Exception {
        String codigo = registrar();
        String otro = codigo.equals("000000") ? "111111" : "000000";

        for (int i = 0; i < 4; i++) {
            verificar(otro).andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.codigo").value("CODIGO_INVALIDO"));
        }
        verificar(otro).andExpect(status().isTooManyRequests());
        verificar(codigo).andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.codigo").value("CODIGO_BLOQUEADO"));
    }

    @Test
    void unCodigoVencidoNoSirveYSePuedePedirOtro() throws Exception {
        String codigo = registrar();
        var guardado = codigoRepository.findAll().stream()
                .filter(c -> c.getUsuarioId().equals(usuarioRepository.findByEmail(email).orElseThrow().getId()))
                .findFirst().orElseThrow();
        guardado.setVenceEn(Instant.now().minusSeconds(1));
        guardado.setCreadoEn(Instant.now().minusSeconds(3600));
        codigoRepository.save(guardado);

        verificar(codigo).andExpect(status().isBadRequest());

        clearInvocations(emailService);
        mockMvc.perform(post("/api/auth/reenviar-verificacion")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isOk());
        ArgumentCaptor<String> nuevo = ArgumentCaptor.forClass(String.class);
        verify(emailService).enviarCodigoVerificacion(eq(email), nuevo.capture(), anyInt());

        verificar(nuevo.getValue()).andExpect(status().isOk());
    }

    @Test
    void reenviarNoRevelaSiLaCuentaExisteYNoMandaDosSeguidos() throws Exception {
        registrar();
        clearInvocations(emailService);

        for (String destino : new String[] {email, "nadie@example.com"}) {
            mockMvc.perform(post("/api/auth/reenviar-verificacion")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"" + destino + "\"}"))
                    .andExpect(status().isOk());
        }
        verify(emailService, never()).enviarCodigoVerificacion(anyString(), anyString(), anyInt());
    }

    // ---------------------------------------------------------------

    private String registrar() throws Exception {
        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tipoCuenta\":\"FAMILIA\",\"nombre\":\"Ana\",\"apellido\":\"Prueba\","
                                + "\"email\":\"" + email + "\",\"password\":\"Prueba123!\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.verificacionPendiente").value(true));
        ArgumentCaptor<String> codigo = ArgumentCaptor.forClass(String.class);
        verify(emailService).enviarCodigoVerificacion(eq(email), codigo.capture(), anyInt());
        return codigo.getValue();
    }

    private ResultActions verificar(String codigo) throws Exception {
        return mockMvc.perform(post("/api/auth/verificar-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"codigo\":\"" + codigo + "\"}"));
    }

    private ResultActions login() throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"Prueba123!\"}"));
    }
}
