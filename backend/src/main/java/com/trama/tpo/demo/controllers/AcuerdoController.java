package com.trama.tpo.demo.controllers;

import com.trama.tpo.demo.entity.dto.AcuerdoRequest;
import com.trama.tpo.demo.entity.dto.AcuerdoResponse;
import com.trama.tpo.demo.entity.dto.CumplidoRequest;
import com.trama.tpo.demo.service.AcuerdoService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

// 5.6: acuerdos de una reunión, con responsable y fecha de revisión
@RestController
@RequestMapping("/api/proyectos/{proyectoId}/acuerdos")
public class AcuerdoController {

    private final AcuerdoService acuerdoService;

    public AcuerdoController(AcuerdoService acuerdoService) {
        this.acuerdoService = acuerdoService;
    }

    // CREAR ACUERDO
    @PostMapping
    public ResponseEntity<AcuerdoResponse> crear(
            @PathVariable UUID proyectoId,
            @Valid @RequestBody AcuerdoRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(acuerdoService.crear(proyectoId, request));
    }

    // ACUERDOS DE UNA REUNIÓN
    @GetMapping
    public ResponseEntity<List<AcuerdoResponse>> listar(
            @PathVariable UUID proyectoId,
            // Opcional acá para que el permiso se verifique antes (un ajeno recibe 403, no 400)
            @RequestParam(required = false) UUID reunionId) {

        return ResponseEntity.ok(acuerdoService.listar(proyectoId, reunionId));
    }

    // EDITAR ACUERDO
    @PutMapping("/{acuerdoId}")
    public ResponseEntity<AcuerdoResponse> editar(
            @PathVariable UUID proyectoId,
            @PathVariable UUID acuerdoId,
            @Valid @RequestBody AcuerdoRequest request) {

        return ResponseEntity.ok(acuerdoService.editar(proyectoId, acuerdoId, request));
    }

    // MARCAR O DESMARCAR CUMPLIDO
    @PutMapping("/{acuerdoId}/cumplido")
    public ResponseEntity<AcuerdoResponse> marcarCumplido(
            @PathVariable UUID proyectoId,
            @PathVariable UUID acuerdoId,
            @Valid @RequestBody CumplidoRequest request) {

        return ResponseEntity.ok(
                acuerdoService.marcarCumplido(proyectoId, acuerdoId, request.cumplido()));
    }
}
