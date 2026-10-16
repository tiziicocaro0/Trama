package com.trama.tpo.demo.config;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    // Duracion del token: 8 horas
    private static final long JWT_EXPIRATION = 8 * 60 * 60 * 1000L;

    @Value("${JWT_SECRET}")
    private String secretKey;

    // GENERAR TOKEN

    public String generateToken(UUID usuarioId) {
        return buildToken(usuarioId, JWT_EXPIRATION);
    }

    private String buildToken(UUID usuarioId, long expiration) {

        long currentTime = System.currentTimeMillis();

        return Jwts.builder()
                .subject(usuarioId.toString())
                .issuedAt(new Date(currentTime))
                .expiration(new Date(currentTime + expiration))
                .signWith(getSecretKey())
                .compact();
    }

    // VALIDAR TOKEN

    public boolean isTokenValid(String token, UUID usuarioId) {

        try {
            UUID tokenUsuarioId = extractUsuarioId(token);

            return tokenUsuarioId.equals(usuarioId)
                    && !isTokenExpired(token);

        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
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