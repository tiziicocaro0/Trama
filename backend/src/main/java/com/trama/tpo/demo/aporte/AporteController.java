package com.trama.tpo.demo.aporte;

import java.net.URI;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.trama.tpo.demo.aporte.dto.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/aportes")
public class AporteController {
    private final AporteService service;
    public AporteController(AporteService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<AportesPerfilResponse> listar(@PathVariable UUID proyectoId) {
        return ResponseEntity.ok(service.listar(proyectoId));
    }

    @PostMapping
    public ResponseEntity<AporteResponse> crear(@PathVariable UUID proyectoId, @Valid @RequestBody AporteRequest request) {
        AporteResponse respuesta = service.crear(proyectoId, request);
        return ResponseEntity.created(URI.create("/api/proyectos/" + proyectoId + "/aportes/" + respuesta.id())).body(respuesta);
    }

    @PutMapping("/{aporteId}")
    public ResponseEntity<AporteResponse> editar(@PathVariable UUID proyectoId, @PathVariable UUID aporteId,
            @Valid @RequestBody AporteRequest request) {
        return ResponseEntity.ok(service.editar(proyectoId, aporteId, request));
    }
}
