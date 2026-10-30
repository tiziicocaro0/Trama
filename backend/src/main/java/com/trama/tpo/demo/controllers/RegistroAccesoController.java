package com.trama.tpo.demo.controllers;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.trama.tpo.demo.entity.dto.RegistroAccesoResponse;
import com.trama.tpo.demo.service.RegistroAccionService;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/registro-accesos")
public class RegistroAccesoController {

    private final RegistroAccionService registroAccionService;

    public RegistroAccesoController(RegistroAccionService registroAccionService) {
        this.registroAccionService = registroAccionService;
    }

    // 8.0 REGISTRO DE ACCESOS (solo tutores)
    @GetMapping
    public ResponseEntity<List<RegistroAccesoResponse>> listar(
            @PathVariable UUID proyectoId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) UUID usuarioId) {

        return ResponseEntity.ok(
                registroAccionService.listarAccesos(proyectoId, desde, hasta, usuarioId));
    }
}
