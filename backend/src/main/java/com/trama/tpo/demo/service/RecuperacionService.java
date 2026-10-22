package com.trama.tpo.demo.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.entity.dto.RestablecerContrasenaRequest;
import com.trama.tpo.demo.entity.dto.SolicitarRecuperacionRequest;
import com.trama.tpo.demo.entity.dto.VerificarCodigoRequest;
import com.trama.tpo.demo.entity.usuario.TokenRecuperacion;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.TokenRecuperacionRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

/**
 * 1.11: recuperar contraseña con un codigo de 6 digitos enviado por mail.
 * El codigo vence a los 10 minutos y se bloquea despues de 5 intentos fallidos.
 */
@Service
public class RecuperacionService {

    public static final int MINUTOS_VIGENCIA = 10;
    public static final int MAX_INTENTOS = 5;
    public static final long SEGUNDOS_ENTRE_ENVIOS = 60;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UsuarioRepository usuarioRepository;
    private final TokenRecuperacionRepository tokenRecuperacionRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public RecuperacionService(
            UsuarioRepository usuarioRepository,
            TokenRecuperacionRepository tokenRecuperacionRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService) {

        this.usuarioRepository = usuarioRepository;
        this.tokenRecuperacionRepository = tokenRecuperacionRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    // 1.11 - PASO 1: PEDIR EL CODIGO
    // La respuesta es siempre la misma exista o no el email, para no filtrar
    // que direcciones estan registradas (el mensaje lo arma el controller).
    @Transactional
    public void solicitarRecuperacion(SolicitarRecuperacionRequest request) {

        String email = normalizar(request.getEmail());

        usuarioRepository.findByEmail(email).ifPresent(usuario -> {

            Instant ahora = Instant.now();

            List<TokenRecuperacion> pendientes = tokenRecuperacionRepository
                    .findByUsuarioIdAndUsadoEnIsNull(usuario.getId());

            // Evita mandar varios mails seguidos si se aprieta "reenviar" muchas veces.
            boolean pedidoReciente = pendientes.stream().anyMatch(token ->
                    token.getCreadoEn() != null
                    && token.getCreadoEn().isAfter(
                            ahora.minusSeconds(SEGUNDOS_ENTRE_ENVIOS)));

            if (pedidoReciente) {
                return;
            }

            // Solo vale el ultimo codigo pedido: los anteriores quedan invalidados.
            pendientes.forEach(token -> token.setUsadoEn(ahora));
            tokenRecuperacionRepository.saveAll(pendientes);

            String codigo = generarCodigo();

            tokenRecuperacionRepository.saveAndFlush(TokenRecuperacion.builder()
                    .usuario(usuario)
                    .tokenHash(calcularHash(usuario.getId(), codigo))
                    .venceEn(ahora.plus(MINUTOS_VIGENCIA, ChronoUnit.MINUTES))
                    .build());

            emailService.enviarCodigoRecuperacion(email, codigo, MINUTOS_VIGENCIA);
        });
    }

    // 1.11 - PASO 2: VERIFICAR EL CODIGO (no lo consume)
    // noRollbackFor: el contador de intentos fallidos se tiene que guardar
    // aunque el metodo termine lanzando la excepcion.
    @Transactional(noRollbackFor = ApiException.class)
    public void verificarCodigo(VerificarCodigoRequest request) {

        validarCodigo(request.getEmail(), request.getCodigo());
    }

    // 1.11 - PASO 3: ELEGIR LA NUEVA CONTRASEÑA (consume el codigo)
    @Transactional(noRollbackFor = ApiException.class)
    public void restablecerContrasena(RestablecerContrasenaRequest request) {

        TokenRecuperacion token =
                validarCodigo(request.getEmail(), request.getCodigo());

        Usuario usuario = token.getUsuario();

        usuario.setPasswordHash(
                passwordEncoder.encode(request.getPassword())
        );

        usuarioRepository.save(usuario);

        token.setUsadoEn(Instant.now());
        tokenRecuperacionRepository.save(token);
    }

    private TokenRecuperacion validarCodigo(String emailIngresado, String codigo) {

        Usuario usuario = usuarioRepository.findByEmail(normalizar(emailIngresado))
                .orElseThrow(this::codigoInvalido);

        TokenRecuperacion token = tokenRecuperacionRepository
                .findFirstByUsuarioIdAndUsadoEnIsNullOrderByCreadoEnDesc(usuario.getId())
                .orElseThrow(this::codigoInvalido);

        if (token.getVenceEn().isBefore(Instant.now())) {
            throw codigoInvalido();
        }

        if (token.getIntentos() >= MAX_INTENTOS) {
            throw codigoBloqueado();
        }

        byte[] esperado = token.getTokenHash().getBytes(StandardCharsets.UTF_8);
        byte[] recibido = calcularHash(usuario.getId(), codigo)
                .getBytes(StandardCharsets.UTF_8);

        // Comparacion en tiempo constante.
        if (!MessageDigest.isEqual(esperado, recibido)) {

            token.setIntentos(token.getIntentos() + 1);
            tokenRecuperacionRepository.save(token);

            if (token.getIntentos() >= MAX_INTENTOS) {
                throw codigoBloqueado();
            }

            throw codigoInvalido();
        }

        return token;
    }

    private ApiException codigoInvalido() {

        return new ApiException(
                "CODIGO_INVALIDO",
                "El código no es válido o ya venció",
                HttpStatus.BAD_REQUEST
        );
    }

    private ApiException codigoBloqueado() {

        return new ApiException(
                "CODIGO_BLOQUEADO",
                "Superaste la cantidad de intentos. Pedí un código nuevo",
                HttpStatus.TOO_MANY_REQUESTS
        );
    }

    private static String normalizar(String email) {

        return email.trim().toLowerCase(Locale.ROOT);
    }

    // Codigo numerico de 6 digitos (000000 a 999999).
    private static String generarCodigo() {

        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    // Se mezcla el id del usuario para que dos personas con el mismo codigo
    // no generen el mismo hash (token_hash es UNIQUE).
    static String calcularHash(UUID usuarioId, String codigo) {

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    (usuarioId + ":" + codigo).getBytes(StandardCharsets.UTF_8)
            );

            return HexFormat.of().formatHex(hash);

        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(
                    "No se pudo generar el hash del codigo",
                    e
            );
        }
    }
}
