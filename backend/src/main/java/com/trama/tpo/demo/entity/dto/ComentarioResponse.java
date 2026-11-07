package com.trama.tpo.demo.entity.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ComentarioResponse(
        UUID id,
        UUID aporteId,
        UUID autorId,
        String autorNombre,
        String texto,
        LocalDateTime fecha
) {}
