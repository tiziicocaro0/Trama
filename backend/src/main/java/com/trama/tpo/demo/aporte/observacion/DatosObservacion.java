package com.trama.tpo.demo.aporte.observacion;

import java.time.OffsetDateTime;
import java.util.Set;

public record DatosObservacion(
        OffsetDateTime fecha,
        ContextoObservacion contexto,
        Set<EtiquetaObservacion> etiquetas
) {
}