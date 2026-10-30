package com.trama.tpo.demo.entity.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Lista de especialidades que un profesional declara para una membresía.
 */
public record EspecialidadRequest(

        @NotEmpty(message = "Debe seleccionar al menos una especialidad")
        @Size(max = 10, message = "No se pueden declarar más de 10 especialidades")
        @Valid
        List<EspecialidadItemRequest> especialidades
) {}
