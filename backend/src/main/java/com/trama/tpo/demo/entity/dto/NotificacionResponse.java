package com.trama.tpo.demo.entity.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificacionResponse(
        UUID id,
        UUID proyectoId,
        String tipo,
        String texto,
        String link,
        Boolean leida,
        Instant fecha
) {
}