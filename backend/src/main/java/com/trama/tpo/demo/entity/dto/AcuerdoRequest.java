package com.trama.tpo.demo.entity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

// 5.6: crear o editar un acuerdo de una reunión
public record AcuerdoRequest(

        @NotNull(message = "Indicá la reunión")
        UUID reunionId,

        @NotBlank(message = "Contá en qué consiste el acuerdo")
        @Size(max = 500, message = "El acuerdo no puede superar los 500 caracteres")
        String descripcion,

        @NotNull(message = "Indicá quién es responsable")
        UUID responsableId,

        @NotNull(message = "Indicá la fecha de revisión")
        LocalDate fechaRevision

) {}
