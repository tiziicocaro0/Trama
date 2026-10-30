package com.trama.tpo.demo.aporte.nota;

import java.time.LocalDate;

// 4.2: campos propios de una nota profesional, guardados en el JSON "datos" del aporte.
public record DatosNota(
        TipoNota tipoNota,
        LocalDate fecha
) {
}
