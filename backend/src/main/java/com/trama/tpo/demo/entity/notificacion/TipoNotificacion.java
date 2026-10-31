package com.trama.tpo.demo.entity.notificacion;

import java.util.Arrays;
import java.util.List;

/**
 * 6.1: tipos de notificación que conoce TRAMA. La columna notificacion.tipo sigue siendo texto
 * (VARCHAR 20), así que un tipo nuevo se suma acá sin migración.
 *
 * Los configurables tienen un interruptor de "avisar también por mail" en /cuenta/notificaciones.
 * La invitación no: ya manda su propio mail con el link, tenga cuenta o no la persona.
 */
public enum TipoNotificacion {
    CAMBIO_CALENDARIO(true),   // 5.4
    NOTA_NUEVA(true),          // 4.2
    MENCION(true),             // 6.2
    REVISION(true),            // 3.4
    CAMBIO_PAQUETE(true),      // 9.3
    INVITACION(false);         // 1.3

    private final boolean configurable;

    TipoNotificacion(boolean configurable) {
        this.configurable = configurable;
    }

    public boolean isConfigurable() {
        return configurable;
    }

    public static List<TipoNotificacion> configurables() {
        return Arrays.stream(values()).filter(TipoNotificacion::isConfigurable).toList();
    }

    /** null si el texto no es un tipo conocido (por ejemplo, uno de prueba). */
    public static TipoNotificacion desde(String tipo) {
        return Arrays.stream(values())
                .filter(valor -> valor.name().equals(tipo))
                .findFirst()
                .orElse(null);
    }
}
