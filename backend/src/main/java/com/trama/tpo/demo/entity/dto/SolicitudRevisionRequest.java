package com.trama.tpo.demo.entity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SolicitudRevisionRequest(

    @NotBlank(message = "El motivo es obligatorio")
    @Size(max = 1000, message = "El motivo no puede superar los 1000 caracteres")
    String motivo

) {}