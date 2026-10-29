
package com.trama.tpo.demo.archivo.dto;

import com.trama.tpo.demo.archivo.Archivo;

import java.util.UUID;

public record ArchivoResponse(
        UUID id,
        String nombreOriginal,
        String tipoMime,
        Integer tamanoBytes
) {

    public static ArchivoResponse from(Archivo archivo) {
        return new ArchivoResponse(
                archivo.getId(),
                archivo.getNombreOriginal(),
                archivo.getTipoMime(),
                archivo.getTamanoBytes()
        );
    }
}
