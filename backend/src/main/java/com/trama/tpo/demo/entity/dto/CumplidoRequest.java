package com.trama.tpo.demo.entity.dto;

import jakarta.validation.constraints.NotNull;

// 5.6: marcar o desmarcar un acuerdo como cumplido
public record CumplidoRequest(

        @NotNull(message = "Indicá si el acuerdo está cumplido")
        Boolean cumplido

) {}
