package com.trama.tpo.demo.entity.dto;

import java.util.List;

public record ResumenProyectoResponse(
        List<AporteResponse> intereses,
        List<AporteResponse> fortalezas,
        List<AporteResponse> comunicacion,
        List<AporteResponse> sensorial,
        List<AporteResponse> estrategias,
        List<AporteResponse> desregulacion) {
}

