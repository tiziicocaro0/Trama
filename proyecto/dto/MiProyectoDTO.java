package com.trama.backend.proyecto.dto;

import com.trama.backend.membresia.Rol;

import java.time.Instant;
import java.util.UUID;

/** Una tarjeta de "Mis proyectos" (1.10). */
public record MiProyectoDTO(
        UUID id,
        String nombre,
        String apodo,
        UUID fotoArchivoId,
        Rol rol,
        Boolean esAdmin,
        Instant eliminacionProgramada) {
}
