package com.trama.tpo.demo.entity.dto;

import java.time.Instant;

/**
 * Una versión del historial de un aporte (3.2).
 * fechaCreacion: cuándo se escribió ese contenido.
 * fechaModificacion: cuándo se reemplazó por la versión siguiente (null en la actual).
 */
public record AporteVersionResponse(
        int numero,
        boolean actual,
        String titulo,
        String contenido,
        String datos,
        String autorNombre,
        Instant fechaCreacion,
        Instant fechaModificacion
) {
}
