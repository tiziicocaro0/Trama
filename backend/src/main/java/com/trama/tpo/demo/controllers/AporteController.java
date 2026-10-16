package com.trama.tpo.demo.controllers;

import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.entity.dto.AporteRequest;
import com.trama.tpo.demo.entity.dto.AporteResponse;
import com.trama.tpo.demo.service.AporteService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/aportes")
public class AporteController {

    private final AporteService aporteService;

    public AporteController(AporteService aporteService) {
        this.aporteService = aporteService;
    }

    // CREAR APORTE
    @PostMapping
    public ResponseEntity<AporteResponse> crear(
            @PathVariable UUID proyectoId,
            @Valid @RequestBody AporteRequest request) {

        AporteResponse aporte = aporteService.crear(proyectoId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(aporte);
    }

    // LISTAR APORTES
    @GetMapping
    public ResponseEntity<List<AporteResponse>> listar(
            @PathVariable UUID proyectoId,
            @RequestParam(required = false) TipoAporte tipo,
            @RequestParam(defaultValue = "false") Boolean archivados) {

        return ResponseEntity.ok(
                aporteService.listar(proyectoId, tipo, archivados)
        );
    }

    // EDITAR APORTE
    @PutMapping("/{aporteId}")
    public ResponseEntity<AporteResponse> editar(
            @PathVariable UUID proyectoId,
            @PathVariable UUID aporteId,
            @Valid @RequestBody AporteRequest request) {

        return ResponseEntity.ok(
                aporteService.editar(proyectoId, aporteId, request)
        );
    }

    // ARCHIVAR APORTE
    @PostMapping("/{aporteId}/archivar")
    public ResponseEntity<Void> archivar(
            @PathVariable UUID proyectoId,
            @PathVariable UUID aporteId) {

        aporteService.archivar(proyectoId, aporteId);

        return ResponseEntity.noContent().build();
    }
}