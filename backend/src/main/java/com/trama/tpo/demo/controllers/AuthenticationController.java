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
import com.trama.tpo.demo.service.RecuperacionService;
import com.trama.tpo.demo.service.VerificacionEmailService;
import com.trama.tpo.demo.entity.dto.AuthenticationResponse;
import com.trama.tpo.demo.entity.dto.MensajeResponse;
import com.trama.tpo.demo.entity.dto.RegisterRequest;
import com.trama.tpo.demo.entity.dto.AuthenticationRequest;
import com.trama.tpo.demo.entity.dto.RestablecerContrasenaRequest;
import com.trama.tpo.demo.entity.dto.SolicitarRecuperacionRequest;
import com.trama.tpo.demo.entity.dto.VerificarCodigoRequest;
import com.trama.tpo.demo.entity.dto.VerificarEmailRequest;
import com.trama.tpo.demo.exceptions.ApiException;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthenticationController {

    private final AuthenticationService service;
    private final RecuperacionService recuperacionService;
    private final VerificacionEmailService verificacionEmailService;

    // Constructor manual
    public AuthenticationController(
            AuthenticationService service,
            RecuperacionService recuperacionService,
            VerificacionEmailService verificacionEmailService) {

        this.service = service;
        this.recuperacionService = recuperacionService;
        this.verificacionEmailService = verificacionEmailService;
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

        AuthenticationResponse respuesta = service.perfil(usuarioId);

        return ResponseEntity.ok(respuesta);
    }

    // REGISTRO - VERIFICAR EL EMAIL CON EL CODIGO (devuelve la sesión)
    @PostMapping("/verificar-email")
    public ResponseEntity<AuthenticationResponse> verificarEmail(
            @Valid @RequestBody VerificarEmailRequest request) {

        return ResponseEntity.ok(
                verificacionEmailService.verificar(request.email(), request.codigo()));
    }

    // REGISTRO - REENVIAR EL CODIGO (misma respuesta exista o no la cuenta)
    @PostMapping("/reenviar-verificacion")
    public ResponseEntity<MensajeResponse> reenviarVerificacion(
            @Valid @RequestBody SolicitarRecuperacionRequest request) {

        verificacionEmailService.reenviar(request.getEmail());

        return ResponseEntity.ok(
                MensajeResponse.builder()
                        .mensaje("Si la cuenta espera verificación, te mandamos un código nuevo.")
                        .build()
        );
    }

    // 1.11 - PASO 1: PEDIR EL CODIGO POR MAIL
    // Responde siempre el mismo mensaje, exista o no el email, para no
    // filtrar que direcciones estan registradas.
    @PostMapping("/recuperar")
    public ResponseEntity<MensajeResponse> recuperar(
            @Valid @RequestBody SolicitarRecuperacionRequest request) {

        recuperacionService.solicitarRecuperacion(request);

        return ResponseEntity.ok(
                MensajeResponse.builder()
                        .mensaje("Si el email está registrado, te enviamos un código de 6 dígitos.")
                        .build()
        );
    }

    // 1.11 - PASO 2: VERIFICAR EL CODIGO
    @PostMapping("/verificar-codigo")
    public ResponseEntity<MensajeResponse> verificarCodigo(
            @Valid @RequestBody VerificarCodigoRequest request) {

        recuperacionService.verificarCodigo(request);

        return ResponseEntity.ok(
                MensajeResponse.builder()
                        .mensaje("El código es correcto.")
                        .build()
        );
    }

    // 1.11 - PASO 3: ELEGIR LA NUEVA CONTRASEÑA
    @PostMapping("/restablecer")
    public ResponseEntity<MensajeResponse> restablecer(
            @Valid @RequestBody RestablecerContrasenaRequest request) {

        recuperacionService.restablecerContrasena(request);

        return ResponseEntity.ok(
                MensajeResponse.builder()
                        .mensaje("Tu contraseña se actualizó correctamente.")
                        .build()
        );
    }
}
