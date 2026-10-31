package com.trama.tpo.demo.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.dto.AuthenticationResponse;
import com.trama.tpo.demo.entity.usuario.CodigoVerificacion;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.CodigoVerificacionRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

/**
 * Registro: la cuenta nueva entra recién cuando confirma el código de 6 dígitos que
 * le llega por mail. Mismas reglas que recuperar la contraseña (1.11): vence a los
 * 10 minutos, 5 intentos y un reenvío por minuto como máximo.
 */
@Service
public class VerificacionEmailService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UsuarioRepository usuarioRepository;
    private final CodigoVerificacionRepository codigoRepository;
    private final EmailService emailService;
    private final JwtService jwtService;

    public VerificacionEmailService(
            UsuarioRepository usuarioRepository,
            CodigoVerificacionRepository codigoRepository,
            EmailService emailService,
            JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.codigoRepository = codigoRepository;
        this.emailService = emailService;
        this.jwtService = jwtService;
    }

    /** Genera un código nuevo (el anterior deja de servir) y lo manda por mail. */
    @Transactional
    public void enviarCodigo(Usuario usuario) {
        String codigo = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        Instant ahora = Instant.now();

        codigoRepository.save(CodigoVerificacion.builder()
                .usuarioId(usuario.getId())
                .codigoHash(hash(usuario.getId(), codigo))
                .venceEn(ahora.plus(RecuperacionService.MINUTOS_VIGENCIA, ChronoUnit.MINUTES))
                .intentos(0)
                .creadoEn(ahora)
                .build());

        emailService.enviarCodigoVerificacion(
                usuario.getEmail(), codigo, RecuperacionService.MINUTOS_VIGENCIA);
    }

    /** Siempre responde igual: no revela si el email existe o ya está verificado. */
    @Transactional
    public void reenviar(String email) {
        usuarioRepository.findByEmail(normalizar(email))
                .filter(usuario -> !Boolean.TRUE.equals(usuario.getEmailVerificado()))
                .filter(usuario -> codigoRepository.findById(usuario.getId())
                        .map(c -> c.getCreadoEn().isBefore(Instant.now()
                                .minusSeconds(RecuperacionService.SEGUNDOS_ENTRE_ENVIOS)))
                        .orElse(true))
                .ifPresent(this::enviarCodigo);
    }

    // noRollbackFor: el intento fallido se guarda aunque se responda con error.
    @Transactional(noRollbackFor = ApiException.class)
    public AuthenticationResponse verificar(String email, String codigo) {
        Usuario usuario = usuarioRepository.findByEmail(normalizar(email))
                .orElseThrow(VerificacionEmailService::codigoInvalido);

        if (Boolean.TRUE.equals(usuario.getEmailVerificado())) {
            throw new ApiException("EMAIL_YA_VERIFICADO",
                    "Tu email ya está verificado. Ingresá con tu contraseña.", HttpStatus.CONFLICT);
        }

        CodigoVerificacion guardado = codigoRepository.findById(usuario.getId())
                .filter(c -> c.getVenceEn().isAfter(Instant.now()))
                .orElseThrow(VerificacionEmailService::codigoInvalido);

        if (guardado.getIntentos() >= RecuperacionService.MAX_INTENTOS) {
            throw codigoBloqueado();
        }
        if (!MessageDigest.isEqual(
                guardado.getCodigoHash().getBytes(StandardCharsets.UTF_8),
                hash(usuario.getId(), codigo).getBytes(StandardCharsets.UTF_8))) {
            guardado.setIntentos(guardado.getIntentos() + 1);
            codigoRepository.save(guardado);
            throw guardado.getIntentos() >= RecuperacionService.MAX_INTENTOS
                    ? codigoBloqueado() : codigoInvalido();
        }

        usuario.setEmailVerificado(true);
        usuarioRepository.save(usuario);
        codigoRepository.delete(guardado);

        return AuthenticationResponse.builder()
                .accessToken(jwtService.generateToken(usuario.getId()))
                .build();
    }

    private static ApiException codigoInvalido() {
        return new ApiException("CODIGO_INVALIDO",
                "El código no es válido o ya venció", HttpStatus.BAD_REQUEST);
    }

    private static ApiException codigoBloqueado() {
        return new ApiException("CODIGO_BLOQUEADO",
                "Superaste la cantidad de intentos. Pedí un código nuevo", HttpStatus.TOO_MANY_REQUESTS);
    }

    private static String normalizar(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String hash(UUID usuarioId, String codigo) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest((usuarioId + ":" + codigo).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("No se pudo generar el hash del código", e);
        }
    }
}
