package com.trama.tpo.demo.controllers;

import java.util.List;
import java.util.UUID;
import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trama.tpo.demo.entity.dto.ConfiguracionProyectoRequest;
import com.trama.tpo.demo.entity.dto.CrearProyectoRequest;
import com.trama.tpo.demo.entity.dto.MiProyectoDTO;
import com.trama.tpo.demo.entity.dto.ProyectoResponse;
import com.trama.tpo.demo.entity.dto.ProfesionalRedResponse;
import com.trama.tpo.demo.service.ProyectoService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/proyectos")
public class ProyectoController {

    private final ProyectoService proyectoService;

    public ProyectoController(ProyectoService proyectoService) {
        this.proyectoService = proyectoService;
    }

    @PostMapping
    public ResponseEntity<ProyectoResponse> crear(
            @Valid @RequestBody CrearProyectoRequest request) {
        ProyectoResponse proyecto = proyectoService.crear(request);
        return ResponseEntity.created(URI.create("/api/proyectos/" + proyecto.id())).body(proyecto);
    }

    // MIS PROYECTOS (1.10)
    @GetMapping
    public ResponseEntity<List<MiProyectoDTO>> listarMisProyectos() {

        return ResponseEntity.ok(proyectoService.listarMisProyectos());
    }

    // DATOS DE UN NIÑO
    @GetMapping("/{proyectoId}")
    public ResponseEntity<ProyectoResponse> obtener(
            @PathVariable UUID proyectoId) {

        return ResponseEntity.ok(proyectoService.obtener(proyectoId));
    }

    @GetMapping("/{proyectoId}/red")
    public ResponseEntity<List<ProfesionalRedResponse>> listarRed(@PathVariable UUID proyectoId) {
        return ResponseEntity.ok(proyectoService.listarRed(proyectoId));
    }

    // CONFIGURACIÓN DE LA FAMILIA
    @PutMapping("/{proyectoId}/configuracion")
    public ResponseEntity<ProyectoResponse> actualizarConfiguracion(
            @PathVariable UUID proyectoId,
            @Valid @RequestBody ConfiguracionProyectoRequest request) {

        return ResponseEntity.ok(
                proyectoService.actualizarConfiguracion(proyectoId, request));
    }
}
