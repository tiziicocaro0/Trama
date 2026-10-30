package com.trama.tpo.demo.entity.dto;

import java.time.Instant;
import java.util.UUID;

import com.trama.tpo.demo.entity.registro.AccionRegistro;

/** Una fila del registro de accesos (8.0): quién, qué hizo, en qué sección y cuándo. */
public record RegistroAccesoResponse(
        Instant fecha,
        UUID usuarioId,
        String usuarioNombre,
        AccionRegistro accion,
        String seccion
) {
}
