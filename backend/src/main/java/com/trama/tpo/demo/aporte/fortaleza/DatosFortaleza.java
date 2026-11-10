
package com.trama.tpo.demo.aporte.fortaleza;

public record DatosFortaleza(
        ContextoFortaleza contexto,
        String ejemplo,
        // Si el contexto es OTRO: dónde, con las palabras de quien lo carga
        String contextoOtro
) {
}
