package com.trama.tpo.demo.controllers;

import com.trama.tpo.demo.entity.dto.NotificacionResponse;
import com.trama.tpo.demo.entity.dto.PreferenciaNotificacionDto;
import com.trama.tpo.demo.entity.notificacion.Notificacion;
import com.trama.tpo.demo.service.NotificacionService;
import com.trama.tpo.demo.service.PreferenciaNotificacionService;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notificaciones")
public class NotificacionController {

    private final NotificacionService notificacionService;
    private final PreferenciaNotificacionService preferenciaService;

    public NotificacionController(
            NotificacionService notificacionService,
            PreferenciaNotificacionService preferenciaService) {
        this.notificacionService = notificacionService;
        this.preferenciaService = preferenciaService;
    }

    // 6.1 GET: qué tipos de aviso llegan también por mail.
    @GetMapping("/preferencias")
    public List<PreferenciaNotificacionDto> listarPreferencias() {
        return preferenciaService.listar();
    }

    // 6.1 PUT: cambia uno o varios interruptores y devuelve todos.
    @PutMapping("/preferencias")
    public List<PreferenciaNotificacionDto> guardarPreferencias(
            @RequestBody List<PreferenciaNotificacionDto> preferencias) {
        return preferenciaService.guardar(preferencias);
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