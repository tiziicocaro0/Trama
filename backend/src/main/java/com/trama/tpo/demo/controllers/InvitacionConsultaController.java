package com.trama.tpo.demo.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trama.tpo.demo.entity.dto.InvitacionDetalleResponse;
import com.trama.tpo.demo.service.InvitacionService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
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
    // Aceptar una invitacion y crear la membresia.
    @PostMapping("/{token}/aceptar")
    public ResponseEntity<MiembroResponse> aceptarInvitacion(
            @PathVariable String token) {

        MiembroResponse respuesta =
                invitacionService.aceptarInvitacion(token);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(respuesta);
    }
}
