package com.trama.tpo.demo.controllers;

import com.trama.tpo.demo.entity.dto.SolicitarEliminacionRequest;
import com.trama.tpo.demo.service.EliminacionService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/proyectos/{id}/eliminacion")
public class EliminacionController {

    private final EliminacionService eliminacionService;

    public EliminacionController(
            EliminacionService eliminacionService) {
        this.eliminacionService = eliminacionService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> solicitar(
            @PathVariable UUID id,
            @Valid @RequestBody SolicitarEliminacionRequest request) {

        Instant fecha = eliminacionService.solicitarEliminacion(
                id,
                request.nombreConfirmacion()
        );

        return ResponseEntity.ok(Map.of(
                "mensaje", "Eliminación programada correctamente",
                "eliminacionProgramada", fecha.toString()
        ));
    }

    @DeleteMapping
    public ResponseEntity<Void> cancelar(
            @PathVariable UUID id) {

        eliminacionService.cancelarEliminacion(id);

        return ResponseEntity.noContent().build();
    }
}