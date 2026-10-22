package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
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
import com.trama.tpo.demo.entity.dto.VerificarCodigoRequest;
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

    private Usuario usuario;

    @BeforeEach
    void preparar() {

        recuperacionService = new RecuperacionService(
                usuarioRepository,
                tokenRecuperacionRepository,
                passwordEncoder,
                emailService
        );

        usuario = Usuario.builder()
                .id(UUID.randomUUID())
                .nombre("Nora")
                .apellido("Prueba")
                .email("nora@trama.test")
                .passwordHash("hash-anterior")
                .build();
    }

    @Test
    void siElEmailExisteGeneraCodigoDeSeisDigitosYLoEnviaPorMail() throws Exception {

        when(usuarioRepository.findByEmail("nora@trama.test"))
                .thenReturn(Optional.of(usuario));
        when(tokenRecuperacionRepository.findByUsuarioIdAndUsadoEnIsNull(usuario.getId()))
                .thenReturn(List.of());

        recuperacionService.solicitarRecuperacion(
                SolicitarRecuperacionRequest.builder().email(" Nora@trama.test ").build());

        ArgumentCaptor<String> codigo = ArgumentCaptor.forClass(String.class);
        verify(emailService).enviarCodigoRecuperacion(
                eq("nora@trama.test"), codigo.capture(), eq(RecuperacionService.MINUTOS_VIGENCIA));
        assertTrue(codigo.getValue().matches("\\d{6}"));

        ArgumentCaptor<TokenRecuperacion> guardado = ArgumentCaptor.forClass(TokenRecuperacion.class);
        verify(tokenRecuperacionRepository).saveAndFlush(guardado.capture());
        assertEquals(hash(usuario.getId(), codigo.getValue()), guardado.getValue().getTokenHash());
        assertTrue(guardado.getValue().getVenceEn().isBefore(Instant.now().plus(11, ChronoUnit.MINUTES)));
        assertEquals(0, guardado.getValue().getIntentos());
    }

    @Test
    void siElEmailNoExisteNoGeneraCodigoNiEnviaMail() {

        when(usuarioRepository.findByEmail("fantasma@trama.test")).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> recuperacionService.solicitarRecuperacion(
                SolicitarRecuperacionRequest.builder().email("fantasma@trama.test").build()));

        verifyNoInteractions(tokenRecuperacionRepository);
        verifyNoInteractions(emailService);
    }

    @Test
    void pedirUnCodigoNuevoInvalidaLosAnteriores() {

        TokenRecuperacion anterior = token("hash-viejo", Instant.now().minus(5, ChronoUnit.MINUTES));
        when(usuarioRepository.findByEmail("nora@trama.test")).thenReturn(Optional.of(usuario));
        when(tokenRecuperacionRepository.findByUsuarioIdAndUsadoEnIsNull(usuario.getId()))
                .thenReturn(List.of(anterior));

        recuperacionService.solicitarRecuperacion(
                SolicitarRecuperacionRequest.builder().email("nora@trama.test").build());

        assertNotNull(anterior.getUsadoEn());
        verify(emailService).enviarCodigoRecuperacion(anyString(), anyString(), anyInt());
    }

    @Test
    void noReenviaSiYaSePidioUnCodigoHaceMenosDeUnMinuto() {

        TokenRecuperacion reciente = token("hash-reciente", Instant.now().minusSeconds(10));
        when(usuarioRepository.findByEmail("nora@trama.test")).thenReturn(Optional.of(usuario));
        when(tokenRecuperacionRepository.findByUsuarioIdAndUsadoEnIsNull(usuario.getId()))
                .thenReturn(List.of(reciente));

        recuperacionService.solicitarRecuperacion(
                SolicitarRecuperacionRequest.builder().email("nora@trama.test").build());

        assertNull(reciente.getUsadoEn());
        verifyNoInteractions(emailService);
        verify(tokenRecuperacionRepository, never()).saveAndFlush(any());
    }

    @Test
    void codigoCorrectoSeVerificaSinConsumirse() throws Exception {

        TokenRecuperacion vigente = token(hash(usuario.getId(), "123456"), Instant.now());
        prepararTokenVigente(vigente);

        recuperacionService.verificarCodigo(
                VerificarCodigoRequest.builder().email("nora@trama.test").codigo("123456").build());

        assertNull(vigente.getUsadoEn());
        assertEquals(0, vigente.getIntentos());
    }

    @Test
    void codigoIncorrectoSumaUnIntento() throws Exception {

        TokenRecuperacion vigente = token(hash(usuario.getId(), "123456"), Instant.now());
        prepararTokenVigente(vigente);

        ApiException e = assertThrows(ApiException.class, () -> recuperacionService.verificarCodigo(
                VerificarCodigoRequest.builder().email("nora@trama.test").codigo("000000").build()));

        assertEquals("CODIGO_INVALIDO", e.getCodigo());
        assertEquals(1, vigente.getIntentos());
        verify(tokenRecuperacionRepository).save(vigente);
    }

    @Test
    void alQuintoIntentoFallidoElCodigoQuedaBloqueado() throws Exception {

        TokenRecuperacion vigente = token(hash(usuario.getId(), "123456"), Instant.now());
        vigente.setIntentos(RecuperacionService.MAX_INTENTOS - 1);
        prepararTokenVigente(vigente);

        ApiException e = assertThrows(ApiException.class, () -> recuperacionService.verificarCodigo(
                VerificarCodigoRequest.builder().email("nora@trama.test").codigo("000000").build()));
        assertEquals("CODIGO_BLOQUEADO", e.getCodigo());

        // Aunque ahora se ingrese el codigo correcto, sigue bloqueado.
        ApiException otra = assertThrows(ApiException.class, () -> recuperacionService.verificarCodigo(
                VerificarCodigoRequest.builder().email("nora@trama.test").codigo("123456").build()));
        assertEquals("CODIGO_BLOQUEADO", otra.getCodigo());
    }

    @Test
    void codigoVencidoSeRechaza() throws Exception {

        TokenRecuperacion vencido = token(hash(usuario.getId(), "123456"), Instant.now());
        vencido.setVenceEn(Instant.now().minus(1, ChronoUnit.MINUTES));
        prepararTokenVigente(vencido);

        ApiException e = assertThrows(ApiException.class, () -> recuperacionService.verificarCodigo(
                VerificarCodigoRequest.builder().email("nora@trama.test").codigo("123456").build()));

        assertEquals("CODIGO_INVALIDO", e.getCodigo());
    }

    @Test
    void conCodigoCorrectoActualizaLaContrasenaYConsumeElCodigo() throws Exception {

        TokenRecuperacion vigente = token(hash(usuario.getId(), "123456"), Instant.now());
        prepararTokenVigente(vigente);
        when(passwordEncoder.encode("NuevaClave123!")).thenReturn("hash-nuevo");

        recuperacionService.restablecerContrasena(RestablecerContrasenaRequest.builder()
                .email("nora@trama.test").codigo("123456").password("NuevaClave123!").build());

        assertEquals("hash-nuevo", usuario.getPasswordHash());
        verify(usuarioRepository).save(usuario);
        assertNotNull(vigente.getUsadoEn());
    }

    @Test
    void conCodigoIncorrectoNoCambiaLaContrasena() throws Exception {

        TokenRecuperacion vigente = token(hash(usuario.getId(), "123456"), Instant.now());
        prepararTokenVigente(vigente);

        assertThrows(ApiException.class, () -> recuperacionService.restablecerContrasena(
                RestablecerContrasenaRequest.builder()
                        .email("nora@trama.test").codigo("999999").password("NuevaClave123!").build()));

        assertEquals("hash-anterior", usuario.getPasswordHash());
        verify(usuarioRepository, never()).save(any());
    }

    private void prepararTokenVigente(TokenRecuperacion token) {

        when(usuarioRepository.findByEmail("nora@trama.test")).thenReturn(Optional.of(usuario));
        when(tokenRecuperacionRepository
                .findFirstByUsuarioIdAndUsadoEnIsNullOrderByCreadoEnDesc(usuario.getId()))
                .thenReturn(Optional.of(token));
    }

    private TokenRecuperacion token(String tokenHash, Instant creadoEn) {

        return TokenRecuperacion.builder()
                .id(UUID.randomUUID())
                .usuario(usuario)
                .tokenHash(tokenHash)
                .venceEn(Instant.now().plus(RecuperacionService.MINUTOS_VIGENCIA, ChronoUnit.MINUTES))
                .creadoEn(creadoEn)
                .build();
    }

    private static String hash(UUID usuarioId, String codigo) throws Exception {

        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        return HexFormat.of().formatHex(
                digest.digest((usuarioId + ":" + codigo).getBytes(StandardCharsets.UTF_8)));
    }
}
