package com.trama.tpo.demo.controllers;

import com.trama.tpo.demo.aporte.SolicitudRevision;
import com.trama.tpo.demo.entity.dto.SolicitudRevisionRequest;
import com.trama.tpo.demo.service.SolicitudRevisionService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/proyectos/{id}")
public class SolicitudRevisionController {

    private final SolicitudRevisionService revisionService;

    public SolicitudRevisionController(
            SolicitudRevisionService revisionService) {
        this.revisionService = revisionService;
    }

    @PostMapping("/aportes/{aporteId}/revision")
    public ResponseEntity<Map<String, Object>> solicitarRevision(
            @PathVariable("id") UUID proyectoId,
            @PathVariable UUID aporteId,
            @Valid @RequestBody SolicitudRevisionRequest request) {

        SolicitudRevision revision =
                revisionService.solicitarRevision(
                        proyectoId, aporteId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of(
                        "id", revision.getId(),
                        "estado", revision.getEstado().name(),
                        "mensaje", "Solicitud de revisión creada"
                )
        );
    }

        @GetMapping("/revisiones/{revisionId}")
        public ResponseEntity<Map<String, Object>> obtenerRevision(
                @PathVariable("id") UUID proyectoId,
                @PathVariable UUID revisionId) {

        // Consultar la revisión verificando los permisos.
        SolicitudRevision revision =
                revisionService.obtenerRevision(
                        proyectoId,
                        revisionId
                );

        // Devolver solamente los datos necesarios.
        return ResponseEntity.ok(
                Map.of(
                        "id", revision.getId(),
                        "aporteId", revision.getAporte().getId(),
                        "motivo", revision.getMotivo(),
                        "estado", revision.getEstado().name()
                )
        );
        }

    @PutMapping("/revisiones/{revisionId}")
    public ResponseEntity<Map<String, Object>> marcarComoRevisada(
            @PathVariable("id") UUID proyectoId,
            @PathVariable UUID revisionId) {

        SolicitudRevision revision =
                revisionService.marcarComoRevisada(
                        proyectoId, revisionId);

        return ResponseEntity.ok(
                Map.of(
                        "id", revision.getId(),
                        "estado", revision.getEstado().name(),
                        "mensaje", "Solicitud marcada como revisada"
                )
        );
    }
}