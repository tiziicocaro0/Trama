package com.trama.tpo.demo.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trama.tpo.demo.entity.dto.MiembroResponse;
import com.trama.tpo.demo.service.MiembroService;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/miembros")
public class MiembroController {

    private final MiembroService miembroService;

    public MiembroController(MiembroService miembroService) {
        this.miembroService = miembroService;
    }

    // 1.3 - CONSULTAR LOS INTEGRANTES DE UN PROYECTO
    @GetMapping
    public ResponseEntity<List<MiembroResponse>> listarMiembros(
            @PathVariable UUID proyectoId) {

        return ResponseEntity.ok(
                miembroService.listarMiembros(proyectoId)
        );
    }

    // 1.6 - CONVERTIR UN FAMILIAR EN CO-TUTOR ADMINISTRADOR
    @PutMapping("/{miembroId}/co-tutor")
    public ResponseEntity<MiembroResponse> hacerCoTutor(
            @PathVariable UUID proyectoId,
            @PathVariable UUID miembroId) {

        return ResponseEntity.ok(
                miembroService.hacerCoTutor(proyectoId, miembroId)
        );
    }
}
