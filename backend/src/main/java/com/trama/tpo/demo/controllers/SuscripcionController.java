package com.trama.tpo.demo.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trama.tpo.demo.entity.dto.MiPlanResponse;
import com.trama.tpo.demo.entity.dto.SuscribirseRequest;
import com.trama.tpo.demo.service.SuscripcionService;

import jakarta.validation.Valid;

// 9.1: suscripción del profesional (pago simulado). Siempre sobre el usuario logueado.
@RestController
@RequestMapping("/api/suscripcion")
public class SuscripcionController {

    private final SuscripcionService suscripcionService;

    public SuscripcionController(SuscripcionService suscripcionService) {
        this.suscripcionService = suscripcionService;
    }

    @GetMapping
    public ResponseEntity<MiPlanResponse> obtener() {
        return ResponseEntity.ok(suscripcionService.obtener());
    }

    @PostMapping
    public ResponseEntity<MiPlanResponse> suscribirse(@Valid @RequestBody SuscribirseRequest request) {
        return ResponseEntity.ok(suscripcionService.suscribirse(request));
    }

    @DeleteMapping
    public ResponseEntity<MiPlanResponse> cancelar() {
        return ResponseEntity.ok(suscripcionService.cancelar());
    }
}
