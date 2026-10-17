package com.trama.tpo.demo.aporte.dto;

import java.util.List;

public record AportesPerfilResponse(List<AporteResponse> aportes, boolean puedeCrear) {
}
