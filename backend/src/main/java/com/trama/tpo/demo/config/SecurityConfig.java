package com.trama.tpo.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;

import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthFilter,
            AuthenticationProvider authenticationProvider) {

        this.jwtAuthFilter = jwtAuthFilter;
        this.authenticationProvider = authenticationProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
            // Configuracion CORS desde CorsConfig
            .cors(Customizer.withDefaults())

            // Desactivar CSRF para API con JWT
            .csrf(AbstractHttpConfigurer::disable)

            // Configurar permisos
            .authorizeHttpRequests(req -> req

                // AUTENTICACION
                .requestMatchers("/api/auth/registro", "/api/auth/login").permitAll()
                .requestMatchers("/api/auth/yo").authenticated()

                // USUARIOS
                .requestMatchers("/api/usuarios/**").authenticated()

                // PROYECTOS
                .requestMatchers("/api/proyectos/**").authenticated()

                // MEMBRESIAS
                .requestMatchers("/api/membresias/**").authenticated()

                // INVITACIONES
                .requestMatchers("/api/invitaciones/**").authenticated()

                // APORTES
                .requestMatchers("/api/aportes/**").authenticated()

                // COMENTARIOS
                .requestMatchers("/api/comentarios/**").authenticated()

                // ARCHIVOS
                .requestMatchers("/api/archivos/**").authenticated()

                // SOLICITUDES DE REVISION
                .requestMatchers("/api/solicitudes-revision/**").authenticated()

                // CONFIRMACIONES
                .requestMatchers("/api/confirmaciones/**").authenticated()

                // REGISTROS DE ACCION
                .requestMatchers("/api/registros-accion/**").authenticated()

                // Proteger el resto de la API
                .requestMatchers("/api/**").authenticated()

                // Permitir consultar el estado del servidor
                .requestMatchers("/actuator/health").permitAll()

                // Denegar rutas no declaradas
                .anyRequest().denyAll()
            )

            // Manejo de errores de seguridad
            .exceptionHandling(ex -> ex

                // 401: usuario no autenticado
                .authenticationEntryPoint((request, response, exception) -> {
                    response.setStatus(HttpStatus.UNAUTHORIZED.value());
                    response.setCharacterEncoding("UTF-8");
                    response.setContentType("application/json");

                    response.getWriter().write(
                        "{\"codigo\":\"NO_AUTENTICADO\",\"mensaje\":\"Debés iniciar sesión\"}"
                    );
                })

                // 403: acceso denegado
                .accessDeniedHandler((request, response, exception) -> {
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.setCharacterEncoding("UTF-8");
                    response.setContentType("application/json");

                    response.getWriter().write(
                        "{\"codigo\":\"ACCESO_DENEGADO\",\"mensaje\":\"No tenés permiso para realizar esta acción\"}"
                    );
                })
            )


            // No crear sesiones HTTP
            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            // Proveedor de autenticacion
            .authenticationProvider(authenticationProvider)

            // Validar JWT antes de autenticar
            .addFilterBefore(
                jwtAuthFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}
