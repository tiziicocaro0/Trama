package com.trama.tpo.demo.entity.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 9.4: cómo figura el profesional en este niño. El front precarga las
 * especialidades de la cuenta y la persona las ajusta. El rol no se elige:
 * lo fijó quien invitó.
 */
public record AceptarInvitacionRequest(
        @Size(max = 10, message = "No se pueden declarar más de 10 especialidades")
        List<@NotNull(message = "La especialidad es obligatoria") @Valid EspecialidadItemRequest> especialidades
) {}
