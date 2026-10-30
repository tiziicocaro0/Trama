package com.trama.tpo.demo.controllers;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trama.tpo.demo.entity.dto.AsociarProfesionalRequest;
import com.trama.tpo.demo.entity.dto.ContratarPaqueteRequest;
import com.trama.tpo.demo.entity.dto.InstitucionResponse;
import com.trama.tpo.demo.entity.dto.PaginaInstitucionResponse;
import com.trama.tpo.demo.service.InstitucionService;

import jakarta.validation.Valid;

// 9.2: paquete institucional del usuario logueado (siempre su propia institución).
@RestController
@RequestMapping("/api/institucion")
public class InstitucionController {

    private final InstitucionService institucionService;

    public InstitucionController(InstitucionService institucionService) {
        this.institucionService = institucionService;
    }

    @GetMapping
    public ResponseEntity<PaginaInstitucionResponse> obtener() {
        return ResponseEntity.ok(institucionService.obtenerPagina());
    }

    @PostMapping
    public ResponseEntity<InstitucionResponse> contratar(@Valid @RequestBody ContratarPaqueteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(institucionService.contratar(request));
    }

    @PostMapping("/profesionales")
    public ResponseEntity<InstitucionResponse> asociar(@Valid @RequestBody AsociarProfesionalRequest request) {
        return ResponseEntity.ok(institucionService.asociar(request));
    }

    // 9.3: cerrar el aviso de cambio automático de paquete
    @PutMapping("/aviso")
    public ResponseEntity<InstitucionResponse> cerrarAviso() {
        return ResponseEntity.ok(institucionService.cerrarAviso());
    }

    @DeleteMapping("/profesionales/{licenciaId}")
    public ResponseEntity<InstitucionResponse> quitar(@PathVariable UUID licenciaId) {
        return ResponseEntity.ok(institucionService.quitar(licenciaId));
    }
}
