package com.trama.tpo.demo.entity.dto;

import java.util.UUID;

import com.trama.tpo.demo.entity.plan.Paquete;

/** 9.2: paquete institucional. Un cupo null significa sin límite. */
public record PaqueteResponse(UUID id, String nombre, Integer cupoNinos, Integer cupoProfesionales, int precioArs) {

    public static PaqueteResponse from(Paquete paquete) {
        return new PaqueteResponse(paquete.getId(), paquete.getNombre(), paquete.getCupoNinos(),
                paquete.getCupoProfesionales(), paquete.getPrecio().intValue());
    }
}
