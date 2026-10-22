package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.trama.tpo.demo.entity.dto.RestablecerContrasenaRequest;
import com.trama.tpo.demo.entity.dto.SolicitarRecuperacionRequest;
import com.trama.tpo.demo.entity.usuario.TokenRecuperacion;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.TokenRecuperacionRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.EmailService;
import com.trama.tpo.demo.service.RecuperacionService;

@ExtendWith(MockitoExtension.class)
class RecuperacionServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private TokenRecuperacionRepository tokenRecuperacionRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    private RecuperacionService recuperacionService;

    @BeforeEach
    void preparar() {

        recuperacionService = new RecuperacionService(
                usuarioRepository,
                tokenRecuperacionRepository,
                passwordEncoder,
                emailService,
                "https://trama.example/restablecer"
        );
    }

    @Test
    void siElEmailExisteGeneraTokenYEnviaMail() {

        Usuario usuario = Usuario.builder()
                .id(UUID.randomUUID())
                .nombre("Nora")
                .apellido("Prueba")
                .email("nora@trama.test")
                .passwordHash("hash-anterior")
                .build();

        when(usuarioRepository.findByEmail("nora@trama.test"))
                .thenReturn(Optional.of(usuario));

        recuperacionService.solicitarRecuperacion(
                SolicitarRecuperacionRequest.builder()
                        .email(" Nora@trama.test ")
                        .build()
        );

        ArgumentCaptor<TokenRecuperacion> captor =
                ArgumentCaptor.forClass(TokenRecuperacion.class);

        verify(tokenRecuperacionRepository).saveAndFlush(captor.capture());

        TokenRecuperacion guardado = captor.getValue();
        assertEquals(usuario, guardado.getUsuario());
        assertEquals(64, guardado.getTokenHash().length());
        assertTrue(guardado.getVenceEn().isAfter(Instant.now()));
        assertTrue(guardado.getVenceEn().isBefore(
                Instant.now().plus(2, ChronoUnit.HOURS)
        ));

        verify(emailService).enviarRecuperacion(
                eq("nora@trama.test"),
                contains("?token=")
        );
    }

    @Test
    void siElEmailNoExisteNoGeneraTokenNiEnviaMail() {

        when(usuarioRepository.findByEmail("fantasma@trama.test"))
                .thenReturn(Optional.empty());

        // No debe lanzar ninguna excepcion: el mensaje de respuesta es
        // siempre el mismo, lo decide el controller.
        assertDoesNotThrow(() ->
                recuperacionService.solicitarRecuperacion(
                        SolicitarRecuperacionRequest.builder()
                                .email("fantasma@trama.test")
                                .build()
                )
        );

        verifyNoInteractions(tokenRecuperacionRepository);
        verifyNoInteractions(emailService);
    }

    @Test
    void conTokenValidoActualizaLaContrasena() throws Exception {

        Usuario usuario = Usuario.builder()
                .id(UUID.randomUUID())
                .email("nora@trama.test")
                .passwordHash("hash-anterior")
                .build();

        TokenRecuperacion tokenGuardado = TokenRecuperacion.builder()
                .id(UUID.randomUUID())
                .usuario(usuario)
                .tokenHash(sha256("token-plano"))
                .venceEn(Instant.now().plus(30, ChronoUnit.MINUTES))
                .build();

        when(tokenRecuperacionRepository.findByTokenHash(sha256("token-plano")))
                .thenReturn(Optional.of(tokenGuardado));

        when(passwordEncoder.encode("NuevaClave123!"))
                .thenReturn("hash-nuevo");

        recuperacionService.restablecerContrasena(
                RestablecerContrasenaRequest.builder()
                        .token("token-plano")
                        .password("NuevaClave123!")
                        .build()
        );

        assertEquals("hash-nuevo", usuario.getPasswordHash());
        verify(usuarioRepository).save(usuario);

        ArgumentCaptor<TokenRecuperacion> captor =
                ArgumentCaptor.forClass(TokenRecuperacion.class);
        verify(tokenRecuperacionRepository).save(captor.capture());
        assertNotNull(captor.getValue().getUsadoEn());
    }

    @Test
    void conTokenVencidoRechazaYNoCambiaLaContrasena() throws Exception {

        Usuario usuario = Usuario.builder()
                .id(UUID.randomUUID())
                .email("nora@trama.test")
                .passwordHash("hash-anterior")
                .build();

        TokenRecuperacion tokenVencido = TokenRecuperacion.builder()
                .id(UUID.randomUUID())
                .usuario(usuario)
                .tokenHash(sha256("token-vencido"))
                .venceEn(Instant.now().minus(1, ChronoUnit.MINUTES))
                .build();

        when(tokenRecuperacionRepository.findByTokenHash(sha256("token-vencido")))
                .thenReturn(Optional.of(tokenVencido));

        ApiException excepcion = assertThrows(ApiException.class, () ->
                recuperacionService.restablecerContrasena(
                        RestablecerContrasenaRequest.builder()
                                .token("token-vencido")
                                .password("NuevaClave123!")
                                .build()
                )
        );

        assertEquals("TOKEN_INVALIDO", excepcion.getCodigo());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void conTokenYaUsadoRechazaYNoCambiaLaContrasena() throws Exception {

        Usuario usuario = Usuario.builder()
                .id(UUID.randomUUID())
                .email("nora@trama.test")
                .passwordHash("hash-anterior")
                .build();

        TokenRecuperacion tokenUsado = TokenRecuperacion.builder()
                .id(UUID.randomUUID())
                .usuario(usuario)
                .tokenHash(sha256("token-usado"))
                .venceEn(Instant.now().plus(30, ChronoUnit.MINUTES))
                .usadoEn(Instant.now().minus(1, ChronoUnit.MINUTES))
                .build();

        when(tokenRecuperacionRepository.findByTokenHash(sha256("token-usado")))
                .thenReturn(Optional.of(tokenUsado));

        assertThrows(ApiException.class, () ->
                recuperacionService.restablecerContrasena(
                        RestablecerContrasenaRequest.builder()
                                .token("token-usado")
                                .password("NuevaClave123!")
                                .build()
                )
        );

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void conTokenDesconocidoRechaza() {

        when(tokenRecuperacionRepository.findByTokenHash(anyString()))
                .thenReturn(Optional.empty());

        assertThrows(ApiException.class, () ->
                recuperacionService.restablecerContrasena(
                        RestablecerContrasenaRequest.builder()
                                .token("no-existe")
                                .password("NuevaClave123!")
                                .build()
                )
        );
    }

    private static String sha256(String token) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }
}
