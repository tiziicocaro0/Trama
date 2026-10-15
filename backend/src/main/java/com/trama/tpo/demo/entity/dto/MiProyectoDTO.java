package com.trama.tpo.demo.entity.dto;

import com.trama.tpo.demo.entity.membresia.Rol;

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
