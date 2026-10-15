package com.trama.tpo.demo.entity.dto;

import java.time.LocalDate;
import java.util.UUID;

import com.trama.tpo.demo.entity.proyecto.Proyecto;

public record ProyectoResponse(
        UUID id,
        String nombre,
        String apellido,
        String apodo,
        LocalDate fechaNacimiento,
        String escuela,
        String grado,
        Boolean familiarPuedeCargar,
        Boolean familiarVeNotas) {

    public static ProyectoResponse from(Proyecto proyecto) {
        return new ProyectoResponse(
                proyecto.getId(),
                proyecto.getNombre(),
                proyecto.getApellido(),
                proyecto.getApodo(),
                proyecto.getFechaNacimiento(),
                proyecto.getEscuela(),
                proyecto.getGrado(),
                proyecto.getFamiliarPuedeCargar(),
                proyecto.getFamiliarVeNotas());
    }
}
