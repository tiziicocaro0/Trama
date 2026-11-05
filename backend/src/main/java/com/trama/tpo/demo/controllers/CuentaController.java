package com.trama.tpo.demo.controllers;

import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trama.tpo.demo.entity.dto.AuthenticationResponse;
import com.trama.tpo.demo.entity.dto.MatriculaRequest;
import com.trama.tpo.demo.service.CuentaService;

import jakarta.validation.Valid;

/** La propia cuenta (Mi perfil). Requiere sesión: /api/usuarios/** en SecurityConfig. */
@RestController
@RequestMapping("/api/usuarios/yo")
public class CuentaController {

    private final CuentaService cuentaService;

    public CuentaController(CuentaService cuentaService) {
        this.cuentaService = cuentaService;
    }

    // PUT: guarda o borra la matrícula declarada y devuelve los datos de la cuenta.
    @PutMapping("/matricula")
    public AuthenticationResponse actualizarMatricula(@Valid @RequestBody MatriculaRequest request) {
        return cuentaService.actualizarMatricula(request);
    }
}
