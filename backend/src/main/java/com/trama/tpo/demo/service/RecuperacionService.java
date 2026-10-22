package com.trama.tpo.demo.service;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.entity.dto.RestablecerContrasenaRequest;
import com.trama.tpo.demo.entity.dto.SolicitarRecuperacionRequest;
import com.trama.tpo.demo.entity.usuario.TokenRecuperacion;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.TokenRecuperacionRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

/** 1.11: recuperar contraseña por email, con token de un solo uso valido 1 hora. */
@Service
public class RecuperacionService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UsuarioRepository usuarioRepository;
    private final TokenRecuperacionRepository tokenRecuperacionRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final String urlBaseRecuperacion;

    public RecuperacionService(
            UsuarioRepository usuarioRepository,
            TokenRecuperacionRepository tokenRecuperacionRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            @Value("${trama.recuperacion.url-base:}") String urlBaseRecuperacion) {

        this.usuarioRepository = usuarioRepository;
        this.tokenRecuperacionRepository = tokenRecuperacionRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.urlBaseRecuperacion = urlBaseRecuperacion;
    }

    // 1.11 - SOLICITAR RECUPERACION
    // El mensaje de respuesta es siempre el mismo exista o no el email,
    // para no filtrar que emails estan registrados (ver AuthenticationController).
    @Transactional
    public void solicitarRecuperacion(SolicitarRecuperacionRequest request) {

        String email = request.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        usuarioRepository.findByEmail(email).ifPresent(usuario -> {

            // Genera un token aleatorio seguro; en la base solo se guarda su SHA-256.
            String token = generarToken();
            String tokenHash = calcularHash(token);

            Instant vencimiento = Instant.now().plus(1, ChronoUnit.HOURS);

            TokenRecuperacion tokenRecuperacion = TokenRecuperacion.builder()
                    .usuario(usuario)
                    .tokenHash(tokenHash)
                    .venceEn(vencimiento)
                    .build();

            tokenRecuperacionRepository.saveAndFlush(tokenRecuperacion);

            String enlace = construirEnlace(token);

            emailService.enviarRecuperacion(email, enlace);
        });
    }

    // 1.11 - RESTABLECER CONTRASEÑA
    @Transactional
    public void restablecerContrasena(RestablecerContrasenaRequest request) {

        String tokenHash = calcularHash(request.getToken());

        TokenRecuperacion tokenRecuperacion = tokenRecuperacionRepository
                .findByTokenHash(tokenHash)
                .orElseThrow(this::tokenInvalido);

        Instant ahora = Instant.now();

        if (tokenRecuperacion.getUsadoEn() != null
                || tokenRecuperacion.getVenceEn().isBefore(ahora)) {

            throw tokenInvalido();
        }

        Usuario usuario = tokenRecuperacion.getUsuario();

        usuario.setPasswordHash(
                passwordEncoder.encode(request.getPassword())
        );

        usuarioRepository.save(usuario);

        tokenRecuperacion.setUsadoEn(ahora);
        tokenRecuperacionRepository.save(tokenRecuperacion);
    }

    private ApiException tokenInvalido() {

        return new ApiException(
                "TOKEN_INVALIDO",
                "El enlace no es valido o ya vencio. Volve a pedir la recuperacion.",
                HttpStatus.BAD_REQUEST
        );
    }

    // Genera 32 bytes aleatorios y los convierte en un token URL-safe.
    private String generarToken() {

        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    // Calcula el SHA-256 del token original.
    private String calcularHash(String token) {

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    token.getBytes(StandardCharsets.UTF_8)
            );

            return HexFormat.of().formatHex(hash);

        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(
                    "No se pudo generar el hash del token",
                    e
            );
        }
    }

    // La URL de restablecimiento se configura segun el entorno.
    private String construirEnlace(String token) {

        if (urlBaseRecuperacion == null || urlBaseRecuperacion.isBlank()) {
            throw new IllegalStateException(
                    "Falta configurar trama.recuperacion.url-base"
            );
        }

        String base = urlBaseRecuperacion.trim();
        URI uri = URI.create(base);

        if (!uri.isAbsolute()
                || (!"http".equalsIgnoreCase(uri.getScheme())
                && !"https".equalsIgnoreCase(uri.getScheme()))
                || uri.getHost() == null
                || uri.getRawQuery() != null
                || uri.getRawFragment() != null) {

            throw new IllegalStateException(
                    "La URL base de recuperacion debe ser una direccion HTTP(S) valida, sin query ni fragmento"
            );
        }

        return base + "?token=" + token;
    }
}
