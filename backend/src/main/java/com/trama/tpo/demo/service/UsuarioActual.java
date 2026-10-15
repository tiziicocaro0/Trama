package com.trama.tpo.demo.service;

import java.util.UUID;

import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class UsuarioActual {

    public UUID obtenerId() {

        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof UserDetails)) {

            throw new AuthenticationCredentialsNotFoundException(
                    "Usuario no autenticado"
            );
        }

        try {
            return UUID.fromString(authentication.getName());

        } catch (IllegalArgumentException e) {
            throw new AuthenticationCredentialsNotFoundException(
                    "Identificador de usuario inválido",
                    e
            );
        }
    }
}