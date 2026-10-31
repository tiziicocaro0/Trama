package com.trama.tpo.demo.entity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;

public record EventoOcurrenciaRequest(

        @NotBlank(message = "El titulo es obligatorio")
        @Size(max = 150)
        String titulo,

        LocalTime horaInicio,

        LocalTime horaFin

) {}