package com.trama.tpo.demo.entity.dto;

import java.time.Instant;
import java.util.List;

// 8.4: lo que una persona cargó en un niño, para conservarlo (por ejemplo, antes de dejar la red)
public record MisAportesResponse(
        Instant exportadoEn,
        // Solo el nombre del niño, para saber de qué acompañamiento es
        String nino,
        String autor,
        // Todos sus aportes, también los archivados, del más nuevo al más viejo
        List<AporteResponse> aportes
) {}
