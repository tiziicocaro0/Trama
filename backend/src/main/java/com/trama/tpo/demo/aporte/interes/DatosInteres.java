package com.trama.tpo.demo.aporte.interes;

import jakarta.validation.constraints.NotNull;

public record DatosInteres(

        @NotNull(message = "La categoría es obligatoria")
        CategoriaInteres categoria,

        @NotNull(message = "La intensidad es obligatoria")
        IntensidadInteres intensidad,

        // Si la categoría es OTRO: cuál, con las palabras de quien lo carga
        String categoriaOtra

) {
}