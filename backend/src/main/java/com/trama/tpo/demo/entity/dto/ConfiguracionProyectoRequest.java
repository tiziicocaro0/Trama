package com.trama.tpo.demo.entity.dto;

import jakarta.validation.constraints.NotNull;

public record ConfiguracionProyectoRequest(

        @NotNull(message = "Indicá si la familia puede cargar aportes")
        Boolean familiarPuedeCargar,

        @NotNull(message = "Indicá si la familia puede ver las notas profesionales")
        Boolean familiarVeNotas) {
}
