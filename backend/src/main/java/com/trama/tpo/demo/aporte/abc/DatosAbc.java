package com.trama.tpo.demo.aporte.abc;

import java.time.OffsetDateTime;

import com.trama.tpo.demo.aporte.observacion.ContextoObservacion;

public record DatosAbc(
        String antecedente,
        String conducta,
        String consecuencia,
        OffsetDateTime fecha,
        ContextoObservacion contexto
) {
}

