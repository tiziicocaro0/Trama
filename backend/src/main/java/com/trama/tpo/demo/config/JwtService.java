package com.trama.tpo.demo.config;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.UsuarioRepository;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    // Duracion del token: 8 horas
    private static final long JWT_EXPIRATION = 8 * 60 * 60 * 1000L;

    // Claim con la versión de sesión del usuario. Al cerrar sesión o cambiar la contraseña
    // la versión sube y todos los tokens emitidos antes dejan de valer, aunque no hayan vencido.
    static final String CLAIM_VERSION = "tv";

    @Value("${JWT_SECRET}")
    private String secretKey;

    private final UsuarioRepository usuarioRepository;

    public JwtService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    // GENERAR TOKEN

    public String generateToken(UUID usuarioId) {
        return buildToken(usuarioId, JWT_EXPIRATION);
    }

    private String buildToken(UUID usuarioId, long expiration) {

        long currentTime = System.currentTimeMillis();

        return Jwts.builder()
                .subject(usuarioId.toString())
                .claim(CLAIM_VERSION, versionActual(usuarioId))
                .issuedAt(new Date(currentTime))
                .expiration(new Date(currentTime + expiration))
                .signWith(getSecretKey())
                .compact();
    }

    // VALIDAR TOKEN

    public boolean isTokenValid(String token, UUID usuarioId) {

        try {
            UUID tokenUsuarioId = extractUsuarioId(token);

            Integer versionToken = extractClaim(
                    token, claims -> claims.get(CLAIM_VERSION, Integer.class));

            // Sin versión (tokens viejos) o con una versión anterior: la sesión se cerró
            return tokenUsuarioId.equals(usuarioId)
                    && !isTokenExpired(token)
                    && versionToken != null
                    && versionToken == versionActual(usuarioId);

        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private int versionActual(UUID usuarioId) {
        return usuarioRepository.findById(usuarioId)
                .map(Usuario::getTokenVersion)
                .orElse(0);
    }

    // OBTENER ID DEL USUARIO

    public UUID extractUsuarioId(String token) {

        String usuarioId = extractClaim(
                token,
                Claims::getSubject
        );

        return UUID.fromString(usuarioId);
    }

    // EXTRAER INFORMACION DEL TOKEN

    public <T> T extractClaim(
            String token,
            Function<Claims, T> claimsResolver) {

        Claims claims = extractAllClaims(token);

        return claimsResolver.apply(claims);
    }

    // VERIFICAR EXPIRACION

    private boolean isTokenExpired(String token) {

        Date expiration = extractClaim(
                token,
                Claims::getExpiration
        );

        return expiration.before(new Date());
    }

    // LEER Y VALIDAR FIRMA DEL TOKEN

    private Claims extractAllClaims(String token) {

        return Jwts.parser()
                .verifyWith(getSecretKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // OBTENER CLAVE SECRETA

    private SecretKey getSecretKey() {

        return Keys.hmacShaKeyFor(
                secretKey.getBytes(StandardCharsets.UTF_8)
        );
    }
}