package com.trama.tpo.demo.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.entity.dto.AuthenticationResponse;
import com.trama.tpo.demo.entity.dto.MatriculaRequest;
import com.trama.tpo.demo.entity.usuario.TipoCuenta;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.UsuarioRepository;

/** Datos de la propia cuenta que se editan desde Mi perfil. */
@Service
public class CuentaService {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioActual usuarioActual;
    private final AuthenticationService authenticationService;

    public CuentaService(
            UsuarioRepository usuarioRepository,
            UsuarioActual usuarioActual,
            AuthenticationService authenticationService) {
        this.usuarioRepository = usuarioRepository;
        this.usuarioActual = usuarioActual;
        this.authenticationService = authenticationService;
    }

    // La matrícula es declarada: TRAMA no la verifica, solo la muestra a la red.
    @Transactional
    public AuthenticationResponse actualizarMatricula(MatriculaRequest request) {

        var usuario = usuarioRepository.findById(usuarioActual.obtenerId())
                .orElseThrow(() -> new ApiException(
                        "USUARIO_NO_ENCONTRADO", "Usuario no encontrado", HttpStatus.NOT_FOUND));

        if (usuario.getTipoCuenta() != TipoCuenta.PROFESIONAL && request.matricula() != null) {
            throw new ApiException(
                    "MATRICULA_SOLO_PROFESIONAL",
                    "Solo las cuentas profesionales declaran una matrícula",
                    HttpStatus.BAD_REQUEST);
        }

        usuario.setMatricula(request.matricula());
        usuarioRepository.save(usuario);
        return authenticationService.perfil(usuario.getId());
    }
}
