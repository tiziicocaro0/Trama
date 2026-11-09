package com.trama.tpo.demo.controllers;

import com.trama.tpo.demo.entity.dto.ComentarioRequest;
import com.trama.tpo.demo.entity.dto.ComentarioResponse;
import com.trama.tpo.demo.service.ComentarioService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/aportes/{aporteId}/comentarios")
public class ComentarioController {

    private final ComentarioService comentarioService;

    public ComentarioController(ComentarioService comentarioService) {
        this.comentarioService = comentarioService;
    }

    // CREAR COMENTARIO
    @PostMapping
    public ResponseEntity<ComentarioResponse> crear(
            @PathVariable UUID proyectoId,
            @PathVariable UUID aporteId,
            @Valid @RequestBody ComentarioRequest request) {

        ComentarioResponse comentario =
                comentarioService.crear(proyectoId, aporteId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(comentario);
    }

    // LISTAR COMENTARIOS DE UN APORTE
    @GetMapping
    public ResponseEntity<List<ComentarioResponse>> listar(
            @PathVariable UUID proyectoId,
            @PathVariable UUID aporteId) {

        return ResponseEntity.ok(
                comentarioService.listar(proyectoId, aporteId)
        );
    }
}
