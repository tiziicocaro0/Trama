package com.trama.tpo.demo.entity.dto;

import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;

import java.time.Instant;
import java.util.List;
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
        Instant actualizadoEn,
        // true si el usuario actual es el autor y puede cargar en el proyecto
        Boolean puedeEditar,
        List<UUID> archivoIds
) {

    // Mantiene la compatibilidad con las respuestas existentes.
    public AporteResponse(
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
            Instant actualizadoEn,
            Boolean puedeEditar) {

        this(
                id,
                proyectoId,
                autorId,
                tipo,
                titulo,
                contenido,
                datos,
                visibilidad,
                archivado,
                creadoEn,
                actualizadoEn,
                puedeEditar,
                List.of()
        );
    }
}
