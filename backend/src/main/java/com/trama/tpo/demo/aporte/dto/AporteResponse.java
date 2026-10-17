package com.trama.tpo.demo.aporte.dto;

import java.time.Instant;
import java.util.UUID;
import com.trama.tpo.demo.aporte.*;

public record AporteResponse(UUID id, TipoAporte tipo, String titulo, String contenido,
        Visibilidad visibilidad, Instant creadoEn, Instant actualizadoEn, boolean puedeEditar) {
    public static AporteResponse from(Aporte aporte, UUID usuarioId, boolean puedeCrear) {
        return new AporteResponse(aporte.getId(), aporte.getTipo(), aporte.getTitulo(), aporte.getContenido(),
                aporte.getVisibilidad(), aporte.getCreadoEn(), aporte.getActualizadoEn(),
                puedeCrear && usuarioId.equals(aporte.getAutorId()));
    }
}
