package com.trama.tpo.demo.entity.dto;

import java.util.UUID;
import com.trama.tpo.demo.entity.membresia.Rol;

public record ProfesionalRedResponse(UUID id, String nombre, String apellido, Rol rol, String especialidad) {
}
