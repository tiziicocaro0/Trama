package com.trama.tpo.demo.entity.dto;

import java.time.LocalDate;
import java.util.UUID;

import com.trama.tpo.demo.entity.membresia.Rol;

/**
 * 7.1: Resumen de cada niño para el panel profesional con novedades de los últimos 7 días y estado freemium.
 */
public record PanelItemResponse(
        // El id del proyecto del niño, como en MiProyectoDTO (la foto y el enlace lo usan)
        UUID id,
        String nombre,
        String apellido,
        String apodo,
        LocalDate fechaNacimiento,
        UUID fotoArchivoId,
        Rol rol,
        long aportesNuevos,
        long eventosNuevos,
        long totalNovedades,
        boolean soloLectura
) {
}
