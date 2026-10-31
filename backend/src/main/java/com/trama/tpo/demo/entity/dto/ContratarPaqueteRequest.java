package com.trama.tpo.demo.entity.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** 9.2: contratar un paquete (pago simulado: no viajan datos de tarjeta). */
public record ContratarPaqueteRequest(
        @NotBlank(message = "Ingresá el nombre de la institución")
        @Size(max = 120, message = "El nombre puede tener hasta 120 caracteres")
        String nombre,
        @NotNull(message = "Elegí un paquete")
        UUID paqueteId) {
}
