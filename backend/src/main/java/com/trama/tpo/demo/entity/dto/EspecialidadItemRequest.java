package com.trama.tpo.demo.entity.dto;

import com.trama.tpo.demo.entity.membresia.Especialidad;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Un elemento dentro de la lista de especialidades que envía el profesional.
 */
public record EspecialidadItemRequest(

        @NotNull(message = "La especialidad es obligatoria")
        Especialidad especialidad,

        @Size(max = 120, message = "La aclaración no puede superar los 120 caracteres")
        String aclaracion
) {}
