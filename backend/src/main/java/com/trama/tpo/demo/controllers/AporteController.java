package com.trama.tpo.demo.controllers;

import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.entity.dto.AporteRequest;
import com.trama.tpo.demo.entity.dto.AporteResponse;
import com.trama.tpo.demo.entity.dto.AporteVersionResponse;
import com.trama.tpo.demo.service.AporteService;
import com.trama.tpo.demo.service.AporteVersionService;
import com.trama.tpo.demo.service.ConfirmacionAporteService;

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
    private final AporteVersionService aporteVersionService;
    private final ConfirmacionAporteService confirmacionAporteService;

    public AporteController(
            AporteService aporteService,
            AporteVersionService aporteVersionService,
            ConfirmacionAporteService confirmacionAporteService) {

        this.aporteService = aporteService;
        this.aporteVersionService = aporteVersionService;
        this.confirmacionAporteService = confirmacionAporteService;
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

    // HISTORIAL DE VERSIONES (3.2)
    @GetMapping("/{aporteId}/versiones")
    public ResponseEntity<List<AporteVersionResponse>> listarVersiones(
            @PathVariable UUID proyectoId,
            @PathVariable UUID aporteId) {

        return ResponseEntity.ok(
                aporteVersionService.listarVersiones(proyectoId, aporteId)
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

    // CONFIRMAR UN APORTE AJENO (3.3): "Yo también lo observé" / "A mí también me funcionó"
    @PostMapping("/{aporteId}/confirmaciones")
    public ResponseEntity<Void> confirmar(
            @PathVariable UUID proyectoId,
            @PathVariable UUID aporteId) {

        confirmacionAporteService.confirmar(proyectoId, aporteId);

        return ResponseEntity.noContent().build();
    }

    // QUITAR MI CONFIRMACIÓN (3.3)
    @DeleteMapping("/{aporteId}/confirmaciones")
    public ResponseEntity<Void> quitarConfirmacion(
            @PathVariable UUID proyectoId,
            @PathVariable UUID aporteId) {

        confirmacionAporteService.quitar(proyectoId, aporteId);

        return ResponseEntity.noContent().build();
    }
}