package com.trama.tpo.demo.aporte.dto;

import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import jakarta.validation.constraints.*;

public record AporteRequest(@NotNull TipoAporte tipo, @NotBlank @Size(max = 150) String titulo,
        @Size(max = 10000) String contenido, @NotNull Visibilidad visibilidad) {
    public AporteRequest {
        titulo = titulo == null ? null : titulo.strip();
        contenido = contenido == null || contenido.isBlank() ? null : contenido.strip();
    }
}
