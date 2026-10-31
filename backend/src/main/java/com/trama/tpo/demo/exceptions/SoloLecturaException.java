package com.trama.tpo.demo.exceptions;

import org.springframework.security.access.AccessDeniedException;

/**
 * 9.0: el profesional sin plan pago superó sus proyectos gratuitos.
 * Es un acceso denegado (403) con un código propio, SOLO_LECTURA, para que el front
 * muestre el aviso de suscripción en lugar de un error genérico.
 */
public class SoloLecturaException extends AccessDeniedException {

    public SoloLecturaException(String mensaje) {
        super(mensaje);
    }
}
