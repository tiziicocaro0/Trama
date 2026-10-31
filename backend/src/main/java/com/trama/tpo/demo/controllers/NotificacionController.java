package com.trama.tpo.demo.controllers;

import com.trama.tpo.demo.entity.dto.NotificacionResponse;
import com.trama.tpo.demo.entity.notificacion.Notificacion;
import com.trama.tpo.demo.service.NotificacionService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notificaciones")
public class NotificacionController {

    private final NotificacionService notificacionService;

    public NotificacionController(
            NotificacionService notificacionService) {
        this.notificacionService = notificacionService;
    }

    // GET: ultimas 10 notificaciones del usuario autenticado.
    @GetMapping
    public List<NotificacionResponse> listar() {
        return notificacionService.listar()
                .stream()
                .map(this::convertir)
                .toList();
    }

    // GET: cantidad de notificaciones sin leer.
    @GetMapping("/no-leidas/count")
    public long contarNoLeidas() {
        return notificacionService.contarNoLeidas();
    }

    // PUT: marcar una notificacion como leida.
    @PutMapping("/{id}/leida")
    public ResponseEntity<Void> marcarComoLeida(
            @PathVariable UUID id) {

        notificacionService.marcarComoLeida(id);
        return ResponseEntity.noContent().build();
    }

    // PUT: marcar todas las notificaciones como leidas.
    @PutMapping("/leer-todas")
    public ResponseEntity<Void> marcarTodasComoLeidas() {
        notificacionService.marcarTodasComoLeidas();
        return ResponseEntity.noContent().build();
    }

    private NotificacionResponse convertir(Notificacion notificacion) {
        return new NotificacionResponse(
                notificacion.getId(),
                notificacion.getProyecto() == null
                        ? null
                        : notificacion.getProyecto().getId(),
                notificacion.getTipo(),
                notificacion.getTexto(),
                notificacion.getLink(),
                notificacion.getLeida(),
                notificacion.getFecha()
        );
    }
}