package com.trama.tpo.demo.aporte.interes;

import jakarta.validation.constraints.NotNull;

public record DatosInteres(

        @NotNull(message = "La categoría es obligatoria")
        CategoriaInteres categoria,

        @NotNull(message = "La intensidad es obligatoria")
        IntensidadInteres intensidad

) {
}