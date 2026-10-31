package com.trama.tpo.demo.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trama.tpo.demo.entity.dto.InvitacionRequest;
import com.trama.tpo.demo.entity.dto.InvitacionResponse;
import com.trama.tpo.demo.service.InvitacionPendienteService;
import com.trama.tpo.demo.service.InvitacionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/invitaciones")
public class InvitacionController {

    private final InvitacionService invitacionService;
    private final InvitacionPendienteService invitacionPendienteService;

    public InvitacionController(
            InvitacionService invitacionService,
            InvitacionPendienteService invitacionPendienteService) {
        this.invitacionService = invitacionService;
        this.invitacionPendienteService = invitacionPendienteService;
    }

    // 1.3 - INVITACIONES PENDIENTES (con su vencimiento, para la Red)
    @GetMapping
    public List<InvitacionResponse> listarPendientes(@PathVariable UUID proyectoId) {
        return invitacionPendienteService.listarPendientes(proyectoId);
    }

    // 1.3 - CANCELAR UNA INVITACION PENDIENTE
    @DeleteMapping("/{invitacionId}")
    public ResponseEntity<Void> cancelar(
            @PathVariable UUID proyectoId,
            @PathVariable UUID invitacionId) {
        invitacionPendienteService.cancelar(proyectoId, invitacionId);
        return ResponseEntity.noContent().build();
    }

    // 1.3 - INVITAR A UN MIEMBRO
    @PostMapping
    public ResponseEntity<InvitacionResponse> crearInvitacion(
            @PathVariable UUID proyectoId,
            @Valid @RequestBody InvitacionRequest request) {

        InvitacionResponse respuesta =
                invitacionService.crearInvitacion(proyectoId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(respuesta);
    }
}