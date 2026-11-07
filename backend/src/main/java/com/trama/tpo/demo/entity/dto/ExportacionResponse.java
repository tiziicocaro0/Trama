package com.trama.tpo.demo.entity.dto;

import java.time.Instant;
import java.util.List;

// 8.1: toda la información del niño, para ejercer el derecho de acceso
public record ExportacionResponse(
        Instant exportadoEn,
        ProyectoResponse proyecto,
        List<MiembroResponse> miembros,
        // Todos los tipos (también notas profesionales), activos y archivados
        List<AporteResponse> aportes,
        // Cada evento o serie una sola vez, con el acta de las reuniones
        List<EventoResponse> eventos,
        List<AcuerdoResponse> acuerdos
) {}
