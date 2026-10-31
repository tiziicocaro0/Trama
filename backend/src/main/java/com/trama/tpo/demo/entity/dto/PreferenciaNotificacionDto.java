package com.trama.tpo.demo.entity.dto;

import com.trama.tpo.demo.entity.notificacion.TipoNotificacion;

import jakarta.validation.constraints.NotNull;

/** 6.1: un interruptor de /cuenta/notificaciones. Sirve para el GET y para el PUT. */
public record PreferenciaNotificacionDto(
        @NotNull TipoNotificacion tipo,
        @NotNull Boolean porEmail
) {
}
