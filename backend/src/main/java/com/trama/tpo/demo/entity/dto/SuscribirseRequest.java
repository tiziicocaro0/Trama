package com.trama.tpo.demo.entity.dto;

import com.trama.tpo.demo.entity.plan.PeriodoSuscripcion;

import jakarta.validation.constraints.NotNull;

/** 9.1: el pago es simulado, así que solo viaja el plan elegido (nunca datos de tarjeta). */
public record SuscribirseRequest(
        @NotNull(message = "Elegí un plan") PeriodoSuscripcion periodo) {
}
