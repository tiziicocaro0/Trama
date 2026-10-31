package com.trama.tpo.demo.entity.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.trama.tpo.demo.entity.plan.MotivoCambioPaquete;

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
        List<ProfesionalAsociado> profesionales,
        AvisoCambioPaquete aviso) {

    /** 9.3: la institución pasó sola de paqueteAnterior al actual porque superó ese cupo. */
    public record AvisoCambioPaquete(String paqueteAnterior, MotivoCambioPaquete motivo) {
    }

    public record ProfesionalAsociado(UUID licenciaId, String nombre, String apellido, String email, LocalDate desde) {
    }
}
