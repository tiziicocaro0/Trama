package com.trama.tpo.demo.entity.dto;

import com.trama.tpo.demo.entity.archivo.Archivo;

import java.time.Instant;
import java.util.UUID;

public record ArchivoResponse(
        UUID id,
        UUID proyectoId,
        UUID autorId,
        String nombreOriginal,
        String tipoMime,
        Long tamanoBytes,
        Instant fecha
) {

    public static ArchivoResponse from(Archivo archivo) {
        return new ArchivoResponse(
                archivo.getId(),
                archivo.getProyecto().getId(),
                archivo.getAutor().getId(),
                archivo.getNombreOriginal(),
                archivo.getTipoMime(),
                archivo.getTamanoBytes(),
                archivo.getFecha()
        );
    }
}

