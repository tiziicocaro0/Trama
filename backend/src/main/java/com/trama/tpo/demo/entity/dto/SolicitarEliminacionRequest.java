package com.trama.tpo.demo.entity.dto;

import jakarta.validation.constraints.NotBlank;

public record SolicitarEliminacionRequest(
        @NotBlank(message = "Debés escribir el nombre del niño")
        String nombreConfirmacion
) {
}