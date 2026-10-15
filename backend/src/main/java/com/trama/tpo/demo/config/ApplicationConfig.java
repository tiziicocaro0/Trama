package com.trama.tpo.demo.config;

import java.util.UUID;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;

import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;

import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.UsuarioRepository;

@Configuration
public class ApplicationConfig {
    public ApplicationConfig(UsuarioRepository repository) {
        this.repository = repository;
    }

    private final UsuarioRepository repository;

    // Buscar usuario por UUID
    @Bean
    public UserDetailsService userDetailsService() {

        return usuarioId -> {

            UUID id;

            try {
                id = UUID.fromString(usuarioId);
            } catch (IllegalArgumentException e) {
                throw new UsernameNotFoundException(
                    "Identificador de usuario inválido", e
                );
            }

            Usuario usuario = repository.findById(id)
                    .orElseThrow(() ->
                        new UsernameNotFoundException(
                            "Usuario no encontrado"
                        )
                    );

            return org.springframework.security.core.userdetails.User
                    .withUsername(usuario.getId().toString())
                    .password(usuario.getPasswordHash())
                    .authorities("ROLE_USUARIO")
                    .build();
        };
    }

    // Proveedor de autenticación
    @Bean
    public AuthenticationProvider authenticationProvider(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider();

        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);

        return provider;
    }

    // Administrador de autenticación
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config)
            throws Exception {

        return config.getAuthenticationManager();
    }

    // Cifrado de contraseñas
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}