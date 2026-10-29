package com.trama.tpo.demo.entity.dto;

import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record AporteRequest(

        @NotNull(message = "El tipo de aporte es obligatorio")
        TipoAporte tipo,

        @NotBlank(message = "El título es obligatorio")
        @Size(max = 150, message = "El título no puede superar los 150 caracteres")
        String titulo,

        String contenido,

        String datos,

        Visibilidad visibilidad,

        List<UUID> archivoIds

) {

    // Mantiene la compatibilidad con los aportes existentes.
    public AporteRequest(
            TipoAporte tipo,
            String titulo,
            String contenido,
            String datos,
            Visibilidad visibilidad) {
        this(tipo, titulo, contenido, datos, visibilidad, null);
        }
}
