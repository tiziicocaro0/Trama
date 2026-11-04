package com.trama.tpo.demo.controllers;

import java.util.List;
import java.util.UUID;
import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trama.tpo.demo.entity.dto.ActualizarDatosProyectoRequest;
import com.trama.tpo.demo.entity.dto.ConfiguracionProyectoRequest;
import com.trama.tpo.demo.entity.dto.CrearProyectoRequest;
import com.trama.tpo.demo.entity.dto.MiProyectoDTO;
import com.trama.tpo.demo.entity.dto.ProyectoResponse;
import com.trama.tpo.demo.entity.dto.ResumenProyectoResponse;
import com.trama.tpo.demo.service.EliminacionProyectoService;
import com.trama.tpo.demo.service.ProyectoService;
import com.trama.tpo.demo.service.ResumenService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/proyectos")
public class ProyectoController {

    private final ProyectoService proyectoService;
    private final ResumenService resumenService;
    private final EliminacionProyectoService eliminacionService;

    public ProyectoController(
            ProyectoService proyectoService,
            ResumenService resumenService,
            EliminacionProyectoService eliminacionService) {
        this.proyectoService = proyectoService;
        this.resumenService = resumenService;
        this.eliminacionService = eliminacionService;
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

    // RESUMEN "CONOCELO EN 5 MINUTOS" (2.8)
    @GetMapping("/{proyectoId}/resumen")
    public ResponseEntity<ResumenProyectoResponse> obtenerResumen(
            @PathVariable UUID proyectoId) {

        return ResponseEntity.ok(resumenService.obtener(proyectoId));
    }

    // EDITAR DATOS PERSONALES DEL NIÑO
    @PutMapping("/{proyectoId}")
    public ResponseEntity<ProyectoResponse> actualizarDatos(
            @PathVariable UUID proyectoId,
            @Valid @RequestBody ActualizarDatosProyectoRequest request) {

        return ResponseEntity.ok(
                proyectoService.actualizarDatos(proyectoId, request));
    }

    // CONFIGURACIÓN DE LA FAMILIA
    @PutMapping("/{proyectoId}/configuracion")
    public ResponseEntity<ProyectoResponse> actualizarConfiguracion(
            @PathVariable UUID proyectoId,
            @Valid @RequestBody ConfiguracionProyectoRequest request) {

        return ResponseEntity.ok(
                proyectoService.actualizarConfiguracion(proyectoId, request));
    }

    // 8.2: PROGRAMAR LA ELIMINACIÓN DEL PERFIL (7 días de gracia, solo tutor administrador)
    @PostMapping("/{proyectoId}/eliminacion")
    public ResponseEntity<ProyectoResponse> programarEliminacion(@PathVariable UUID proyectoId) {
        return ResponseEntity.ok(eliminacionService.programar(proyectoId));
    }

    // 8.2: CANCELAR LA ELIMINACIÓN PROGRAMADA
    @DeleteMapping("/{proyectoId}/eliminacion")
    public ResponseEntity<ProyectoResponse> cancelarEliminacion(@PathVariable UUID proyectoId) {
        return ResponseEntity.ok(eliminacionService.cancelar(proyectoId));
    }
}
