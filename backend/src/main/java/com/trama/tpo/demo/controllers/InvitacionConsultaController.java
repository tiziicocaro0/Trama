package com.trama.tpo.demo.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trama.tpo.demo.entity.dto.AceptarInvitacionRequest;
import com.trama.tpo.demo.entity.dto.InvitacionDetalleResponse;
import com.trama.tpo.demo.service.InvitacionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.trama.tpo.demo.entity.dto.MiembroResponse;

@RestController
@RequestMapping("/api/invitaciones")
public class InvitacionConsultaController {

    private final InvitacionService invitacionService;

    public InvitacionConsultaController(InvitacionService invitacionService) {
        this.invitacionService = invitacionService;
    }

    //  Consultar los datos publicos de una invitacion.
    @GetMapping("/{token}")
    public ResponseEntity<InvitacionDetalleResponse> consultarInvitacion(
            @PathVariable String token) {

        InvitacionDetalleResponse respuesta =
                invitacionService.consultarInvitacion(token);

        return ResponseEntity.ok(respuesta);
    }
    // 1.9 — Aceptar una invitacion y crear la membresia (con especialidad si corresponde).
    @PostMapping("/{token}/aceptar")
    public ResponseEntity<MiembroResponse> aceptarInvitacion(
            @PathVariable String token,
            @Valid @RequestBody(required = false) AceptarInvitacionRequest request) {

        MiembroResponse respuesta =
                invitacionService.aceptarInvitacion(token, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(respuesta);
    }
}
