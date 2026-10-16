package com.trama.tpo.demo.config;

import java.io.IOException;
import java.util.UUID;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.JwtException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    // Constructor manual para evitar problemas con Lombok
    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserDetailsService userDetailsService) {

        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // Verificar que exista el token
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extraer token del header
        final String jwt = authHeader.substring(7);

        // Verificar formato básico
        if (jwt.isBlank() || jwt.split("\\.").length != 3) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // Obtener UUID del usuario desde el JWT
            UUID usuarioId = jwtService.extractUsuarioId(jwt);

            if (usuarioId != null &&
                    SecurityContextHolder.getContext().getAuthentication() == null) {

                // Buscar usuario utilizando su UUID
                UserDetails userDetails =
                        userDetailsService.loadUserByUsername(
                                usuarioId.toString()
                        );

                // Verificar que el token sea válido
                if (jwtService.isTokenValid(jwt, usuarioId)
                        && userDetails.isEnabled()
                        && userDetails.isAccountNonLocked()) {

                    // Crear autenticación
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    authToken.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request)
                    );

                    // Guardar usuario autenticado
                    SecurityContextHolder.getContext()
                            .setAuthentication(authToken);
                }
            }

        } catch (JwtException | IllegalArgumentException |
                 UsernameNotFoundException e) {

            // Token inválido, vencido o usuario inexistente
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
