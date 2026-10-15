
package com.trama.tpo.demo.service;

import java.time.Instant;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.dto.AuthenticationRequest;
import com.trama.tpo.demo.entity.dto.AuthenticationResponse;
import com.trama.tpo.demo.entity.dto.RegisterRequest;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final LoginAttemptService loginAttemptService;

    // REGISTRO DE USUARIOS
    @Transactional
    public AuthenticationResponse register(RegisterRequest request) {

        String email = request.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (repository.existsByEmail(email)) {
            throw new ApiException(
                    "EMAIL_EN_USO",
                    "El email ya está registrado",
                    HttpStatus.CONFLICT
            );
        }

        Usuario usuario = new Usuario();

        usuario.setNombre(request.getNombre());
        usuario.setApellido(request.getApellido());
        usuario.setEmail(email);

        usuario.setPasswordHash(
                passwordEncoder.encode(request.getPassword())
        );

        usuario = repository.save(usuario);

        String jwtToken = jwtService.generateToken(
                usuario.getId()
        );

        return AuthenticationResponse.builder()
                .accessToken(jwtToken)
                .build();
    }

    // INICIO DE SESIÓN
    public AuthenticationResponse authenticate(
            AuthenticationRequest request) {

        String email = request.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        Usuario usuario = repository.findByEmail(email)
                .orElseThrow(() ->
                        new BadCredentialsException(
                                "Credenciales inválidas"
                        )
                );

        // Verificar si la cuenta continúa bloqueada
        if (usuario.getBloqueadoHasta() != null
                && usuario.getBloqueadoHasta().isAfter(Instant.now())) {

            throw new ApiException(
                    "CUENTA_BLOQUEADA",
                    "Cuenta bloqueada temporalmente. Intentá nuevamente en 15 minutos.",
                    HttpStatus.TOO_MANY_REQUESTS
            );
        }

        // Validar contraseña
        try {

            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            usuario.getId().toString(),
                            request.getPassword()
                    )
            );

        } catch (BadCredentialsException e) {

            loginAttemptService.registrarIntentoFallido(
                    usuario.getId()
            );

            // Consultar el estado actualizado
            Usuario actualizado = repository.findById(
                    usuario.getId()
            ).orElseThrow();

            // Comprobar si se activó un bloqueo
            if (actualizado.getBloqueadoHasta() != null
                    && actualizado.getBloqueadoHasta()
                            .isAfter(Instant.now())) {

                throw new ApiException(
                        "CUENTA_BLOQUEADA",
                        "Cuenta bloqueada temporalmente. Intentá nuevamente en 15 minutos.",
                        HttpStatus.TOO_MANY_REQUESTS
                );
            }

            throw new BadCredentialsException(
                    "Credenciales inválidas"
            );
        }

        // Reiniciar contador después de un login exitoso
        loginAttemptService.reiniciarIntentos(
                usuario.getId()
        );

        String jwtToken = jwtService.generateToken(
                usuario.getId()
        );

        return AuthenticationResponse.builder()
                .accessToken(jwtToken)
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .email(usuario.getEmail())
                .build();
    }
}