package com.trama.tpo.demo.controllers;

import com.trama.tpo.demo.entity.dto.EventoRequest;
import com.trama.tpo.demo.entity.dto.EventoResponse;
import com.trama.tpo.demo.service.EventoService;

import jakarta.validation.Valid;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/eventos")
public class EventoController {

    private final EventoService eventoService;

    public EventoController(EventoService eventoService) {
        this.eventoService = eventoService;
    }

    // CREAR EVENTO
    @PostMapping
    public ResponseEntity<EventoResponse> crear(
            @PathVariable UUID proyectoId,
            @Valid @RequestBody EventoRequest request) {

        EventoResponse evento = eventoService.crear(proyectoId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(evento);
    }

    // LISTAR EVENTOS ENTRE DOS FECHAS
    // desde y hasta son obligatorios, pero los valida el service después de verificar
    // la membresía: así alguien ajeno recibe 403 y no un 400 (0.21).
    @GetMapping
    public ResponseEntity<List<EventoResponse>> listar(
            @PathVariable UUID proyectoId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate hasta) {

        return ResponseEntity.ok(
                eventoService.listar(proyectoId, desde, hasta)
        );
    }

    // EDITAR EVENTO
    @PutMapping("/{eventoId}")
    public ResponseEntity<EventoResponse> editar(
            @PathVariable UUID proyectoId,
            @PathVariable UUID eventoId,
            @Valid @RequestBody EventoRequest request) {

        return ResponseEntity.ok(
                eventoService.editar(proyectoId, eventoId, request)
        );
    }

    // ELIMINAR EVENTO
    @DeleteMapping("/{eventoId}")
    public ResponseEntity<Void> eliminar(
            @PathVariable UUID proyectoId,
            @PathVariable UUID eventoId) {

        eventoService.eliminar(proyectoId, eventoId);

        return ResponseEntity.noContent().build();
    }
}