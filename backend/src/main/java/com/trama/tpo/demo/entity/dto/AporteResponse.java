package com.trama.tpo.demo.entity.dto;

import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;

import java.time.Instant;
import java.util.UUID;

public record AporteResponse(
        UUID id,
        UUID proyectoId,
        UUID autorId,
        TipoAporte tipo,
        String titulo,
        String contenido,
        String datos,
        Visibilidad visibilidad,
        Boolean archivado,
        Instant creadoEn,
        Instant actualizadoEn
) {
}