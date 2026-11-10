package com.trama.tpo.demo.entity.dto;

import jakarta.validation.constraints.NotNull;

/** 7.0: si la cuenta usa la vista simple. */
public record VistaSimpleRequest(@NotNull(message = "Indicá si la vista simple está activa") Boolean activa) {
}
