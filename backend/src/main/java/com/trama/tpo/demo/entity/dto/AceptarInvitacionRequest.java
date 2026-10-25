package com.trama.tpo.demo.entity.dto;

import com.trama.tpo.demo.entity.membresia.Especialidad;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 1.9 — Body opcional del POST /api/invitaciones/{token}/aceptar.
 * Para roles EDUCACION o SALUD la especialidad es obligatoria (se valida en el service).
 * Para TUTOR o FAMILIAR se ignoran ambos campos.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AceptarInvitacionRequest {

    private Especialidad especialidad;

    @Size(max = 40, message = "La matricula no puede superar los 40 caracteres")
    private String matricula;
}
