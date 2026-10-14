package com.trama.tpo.demo.controllers;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trama.tpo.demo.service.AuthenticationService;
import com.trama.tpo.demo.entity.dto.AuthenticationResponse;
import com.trama.tpo.demo.entity.dto.RegisterRequest;
import com.trama.tpo.demo.entity.dto.AuthenticationRequest;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.UsuarioRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthenticationController {

    private final AuthenticationService service;
    private final UsuarioRepository usuarioRepository;

    // Constructor manual
    public AuthenticationController(
            AuthenticationService service,
            UsuarioRepository usuarioRepository) {

        this.service = service;
        this.usuarioRepository = usuarioRepository;
    }

    // REGISTRO DE USUARIOS
    @PostMapping("/registro")
    public ResponseEntity<AuthenticationResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.register(request));
    }

    // INICIO DE SESIÓN
    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(
            @Valid @RequestBody AuthenticationRequest request) {

        return ResponseEntity.ok(service.authenticate(request));
    }

    // OBTENER DATOS DEL USUARIO AUTENTICADO
    @GetMapping("/yo")
    public ResponseEntity<AuthenticationResponse> obtenerMiPerfil(
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {

            throw new ApiException(
                    "NO_AUTORIZADO",
                    "Debés iniciar sesión",
                    HttpStatus.UNAUTHORIZED
            );
        }

        UUID usuarioId = UUID.fromString(authentication.getName());

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ApiException(
                        "USUARIO_NO_ENCONTRADO",
                        "Usuario no encontrado",
                        HttpStatus.NOT_FOUND
                ));

        AuthenticationResponse respuesta = AuthenticationResponse.builder()
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .email(usuario.getEmail())
                .build();

        return ResponseEntity.ok(respuesta);
    }
}