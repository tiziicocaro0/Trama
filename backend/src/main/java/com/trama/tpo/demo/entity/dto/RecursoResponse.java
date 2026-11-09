package com.trama.tpo.demo.entity.dto;

import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;

import java.time.Instant;
import java.util.UUID;

/**
 * Un archivo de la galería Recursos del niño. Puede venir de dos lados:
 * - origen RECURSO: se subió directo a la pestaña Recursos (tiene visibilidad propia).
 * - origen APORTE: es un adjunto de un aporte (tipoAporte, aporteId y aporteTitulo dicen cuál).
 */
public record RecursoResponse(
        UUID archivoId,
        String nombreOriginal,
        String tipoMime,
        Long tamanoBytes,
        Instant fecha,
        UUID autorId,
        String autorNombre,
        boolean autorTieneFoto,
        Origen origen,
        TipoAporte tipoAporte,
        UUID aporteId,
        String aporteTitulo,
        Visibilidad visibilidad,
        // true si el usuario actual lo subió y es un recurso (los adjuntos se archivan con su aporte)
        boolean puedeArchivar
) {

    public enum Origen {
        RECURSO,
        APORTE
    }
}
