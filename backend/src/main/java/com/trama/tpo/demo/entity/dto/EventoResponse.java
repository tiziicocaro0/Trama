package com.trama.tpo.demo.entity.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record EventoResponse(

        UUID id,
        UUID proyectoId,
        UUID autorId,
        String titulo,
        String descripcion,
        LocalDate fecha,
        LocalTime horaInicio,
        LocalTime horaFin,
        UUID imagenId,
        Instant creadoEn,

        Boolean recurrente,
        Boolean esCambio,
        Byte diaSemana,
        LocalDate fechaFinRecurrencia,
        LocalDate fechaOcurrencia,

        String tipo,
        String acta,
        List<UUID> participanteIds

) {}
