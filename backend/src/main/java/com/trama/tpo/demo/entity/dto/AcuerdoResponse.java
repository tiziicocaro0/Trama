package com.trama.tpo.demo.entity.dto;

import java.time.LocalDate;
import java.util.UUID;

// 5.6
public record AcuerdoResponse(
        UUID id,
        UUID reunionId,
        String descripcion,
        UUID responsableId,
        String responsableNombre,
        LocalDate fechaRevision,
        Boolean cumplido,
        // true si no está cumplido y la fecha de revisión ya pasó
        Boolean vencido,
        // Para que el front muestre u oculte los botones
        Boolean puedeEditar,
        Boolean puedeMarcarCumplido
) {}
