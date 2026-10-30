package com.trama.tpo.demo.controllers;

import com.trama.tpo.demo.entity.dto.EventoRequest;
import com.trama.tpo.demo.entity.dto.EventoResponse;
import com.trama.tpo.demo.entity.dto.EventoOcurrenciaRequest;
import com.trama.tpo.demo.service.EventoService;
import com.trama.tpo.demo.service.EventoOcurrenciaService;

import jakarta.validation.Valid;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/proyectos/{id}/eventos")
public class EventoController {

    private final EventoService eventoService;
    private final EventoOcurrenciaService ocurrenciaService;

    public EventoController(
            EventoService eventoService,
            EventoOcurrenciaService ocurrenciaService) {

        this.eventoService = eventoService;
        this.ocurrenciaService = ocurrenciaService;
    }

    // CREAR EVENTO UNICO O RECURRENTE
    @PostMapping
    public ResponseEntity<EventoResponse> crear(
            @PathVariable("id") UUID proyectoId,
            @Valid @RequestBody EventoRequest request) {

        EventoResponse evento = eventoService.crear(proyectoId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(evento);
    }

    // LISTAR EVENTOS Y OCURRENCIAS ENTRE DOS FECHAS
    @GetMapping
    public ResponseEntity<List<EventoResponse>> listar(
            @PathVariable("id") UUID proyectoId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate desde,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate hasta) {

        return ResponseEntity.ok(
                eventoService.listar(proyectoId, desde, hasta)
        );
    }

    // EDITAR EVENTO UNICO O TODA LA SERIE
    @PutMapping("/{eventoId}")
    public ResponseEntity<EventoResponse> editar(
            @PathVariable("id") UUID proyectoId,
            @PathVariable UUID eventoId,
            @Valid @RequestBody EventoRequest request) {

        return ResponseEntity.ok(
                eventoService.editar(proyectoId, eventoId, request)
        );
    }

    // ELIMINAR EVENTO UNICO O TODA LA SERIE
    @DeleteMapping("/{eventoId}")
    public ResponseEntity<Void> eliminar(
            @PathVariable("id") UUID proyectoId,
            @PathVariable UUID eventoId) {

        eventoService.eliminar(proyectoId, eventoId);

        return ResponseEntity.noContent().build();
    }

    // EDITAR UNA SOLA OCURRENCIA
    @PutMapping("/{eventoId}/ocurrencias/{fecha}")
    public ResponseEntity<Void> editarOcurrencia(
            @PathVariable("id") UUID proyectoId,
            @PathVariable UUID eventoId,
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fecha,
            @Valid @RequestBody EventoOcurrenciaRequest request) {

        ocurrenciaService.editarOcurrencia(
                proyectoId, eventoId, fecha, request);

        return ResponseEntity.noContent().build();
    }

    // CANCELAR UNA SOLA OCURRENCIA
    @DeleteMapping("/{eventoId}/ocurrencias/{fecha}")
    public ResponseEntity<Void> cancelarOcurrencia(
            @PathVariable("id") UUID proyectoId,
            @PathVariable UUID eventoId,
            @PathVariable
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fecha) {

        eventoService.cancelarOcurrencia(
                proyectoId, eventoId, fecha);

        return ResponseEntity.noContent().build();
    }
}