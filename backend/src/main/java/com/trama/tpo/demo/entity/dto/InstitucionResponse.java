package com.trama.tpo.demo.entity.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * 9.2: la institución del responsable. Solo muestra cupos y profesionales asociados:
 * ningún dato de los niños (el responsable no tiene acceso a los proyectos).
 */
public record InstitucionResponse(
        UUID id,
        String nombre,
        PaqueteResponse paquete,
        long ninosUsados,
        long profesionalesUsados,
        List<ProfesionalAsociado> profesionales) {

    public record ProfesionalAsociado(UUID licenciaId, String nombre, String apellido, String email, LocalDate desde) {
    }
}
